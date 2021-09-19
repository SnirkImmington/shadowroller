import * as process from 'process';
import * as fsBase from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as scriptUtil from './scriptUtil';

//
// About this script
////////////////////
//
// At time of writing, presite on my machine is not including <script> tags that
// point to the build project's script sources. This script finds and injects them.
//
// This has not been tested with code splitting. This script should be run for each
// entrypoint.

// closingContent is the ending content of the file. Presite doesn't include a
// trailing newline.
const closingContent = `</body></html>`;

// matchScriptSrc is indeed using a regular expression to parse HTML.
const matchScriptSrc = /<script src="(\/static\/js\/[^j]*js)">/g;


// Check for invalid invocation
if (process.argv.length < 3) {
    console.error(process.argv);
    console.error("Usage: fix-presite.ts <build index path> <presite build index path>");
    process.exit(1);
}

// Get paths from reading cmd args - in this case we have a lot of leading args for
// tsnode, tsnode flags, and filename, so we just grab the last two args.
const buildIndexPath = process.argv[process.argv.length - 2];
const presiteIndexPath = process.argv[process.argv.length - 1];

// Read the base build file's content.
const baseContent = fsBase.readFileSync(buildIndexPath, { encoding: "utf8" });

// Find any <script> tags in the base file.
const matches = baseContent.matchAll(matchScriptSrc);

// Create a buffer of <script src='src.js'/></script> for the scripts
const scriptTags = [];
for (const [tag, src] of matches) {
    console.log("Found ", src);
    scriptTags.push(tag);
    scriptTags.push("</script>");
}
const scriptTagsText = scriptTags.join("");
const scriptTagsFound = scriptTags.length / 2;

// We should have at least 3 scripts: runtime, deps, index.
if (scriptTagsFound < 3) {
    const paths = [];
    for (const [_, src] of matches) {
        paths.push(src);
    }
    throw new Error(
        `Expected to get at least 3 script tags, got ${scriptTagsFound}: ${paths.join(", ")}`
    );
}

// Open output file
fs.open(presiteIndexPath, fsBase.constants.O_RDWR, 0o755)
    // Get stats to calculate offset
    .then(handle => {
        console.log("Opened", presiteIndexPath);
        return Promise.all([handle, handle.stat()]);
    // Write result into file at offset
    }).then(([handle, stats]) => {
        console.log("Found", path.basename(presiteIndexPath), ":", scriptUtil.bytesToMetric(stats.size));
        const offset = stats.size - closingContent.length;

        return Promise.all([handle, handle.write(scriptTagsText, offset)]);
    // Check results, write closing content
    }).then(([handle, result]) => {
        if (result.bytesWritten != scriptTagsText.length) {
            throw new Error(`Wrote ${result.bytesWritten} of ${scriptTags.length} bytes`);
        }
        console.log("Wrote", scriptTagsFound, "script references to file");
        return Promise.all([handle, handle.write(closingContent)]);
    // Check results, close file
    }).then(([handle, result]) => {
        if (result.bytesWritten != closingContent.length) {
            throw new Error(`Wrote ${result.bytesWritten} of ${scriptTags.length} bytes`);
        }
        return handle.close();
    // Assert we closed the file.
    }).then(() => {
        console.log("Build complete.");
    }).catch(err => {
        console.error("Unable to write file:", err);
    });
