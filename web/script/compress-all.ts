import * as child from 'child_process';
import * as fs from 'fs/promises';
import * as fsBase from 'fs';
import * as process from 'process';
import * as stream from 'stream';
import * as util from 'util';
import * as zlib from 'zlib';

const execPromised = util.promisify(child.exec);

function streamCompressFile(path: string): fsBase.WriteStream {
    const outputPath = path + ".gz";
    const input = fsBase.createReadStream(path);
    const output = fsBase.createWriteStream(outputPath);
    const gzip = zlib.createGzip();
    return stream.pipeline(
        input, gzip, output
    );
}

function handleDir(path: string) {
    const entries = [];
    let hasEntries = true;
    return fs.opendir(path)
        .then(dir => {
            while (hasEntries) {
                dir.read().then(entry => {
                    if (!entry) {
                        hasEntries = false;
                        return;
                    }
                    if (entry.isDirectory()) {

                    }
                })
            }
        })
}

if (process.argv.length < 2) {
    console.error(process.argv);
    console.error("Usage: compress-all.ts <path>");
    process.exit(1);
}
const path = process.argv[process.argv.length - 1];

console.log('Compress files in ', path);
execPromised(`gzip -rk ${path}`)
    .then(({ stdout, stderr }) => {
        console.log("Gzip:", stdout);
        return execPromised(`find ${path} -type f -name '*.woff2.gz' -exec rm {};`);
    })
    .then(() => {
        console.log("Removed uncompressible files");
        execPromised(`gzip -lr ${path}`);
    })
    // TODO manual version
    .then(() => console.log("Success!"))
    .catch(err => console.error("Error during script: ", err));
console.log("Reached end of script");
