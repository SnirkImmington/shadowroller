import * as fs from 'fs/promises';
import * as fsBase from 'fs';
import * as zlib from 'zlib';
import * as path from 'path';
import * as stream from 'stream';
import * as util from 'util';
import * as scriptUtil from './scriptUtil';

const pipelinePromise = util.promisify(stream.pipeline);
const filter = [".woff2", ".gz", "robots.txt"];

function readFiles(base: string, folder: string): Promise<string[]> {
    return fs.readdir(path.join(base, folder), { withFileTypes: true })
    .then(subdirs => {
        const subtasks: Promise<string[]>[] = [];
        const results: string[] = [];
        for (const subdir of subdirs) {
            if (subdir.isDirectory()) {
                subtasks.push(readFiles(base, path.join(folder, subdir.name)));
                continue;
            } else if (subdir.isFile()) {
                if (subdir.name.endsWith(".gz")) {
                    continue;
                }
                results.push(path.join(base, folder, subdir.name));
            } else {
                throw new Error(`Found unknown file type ${path.join(folder, subdir.name)}`);
            }
        }
        return Promise.all([Promise.all(subtasks), results]);
    }).then(([subtasks, results]: [string[][], string[]]) => {
        const subtaskResults = subtasks.flat();
        return subtaskResults.concat(results);
    });
}

type CompressionResults = {
    name: string,
    saved: number,
    ratio: number,
    start: number,
    end: number,
}

function streamCompressFile(inputPath: string): Promise<CompressionResults> {
    if (filter.find(filtered => inputPath.endsWith(filtered))) {
        return fs.stat(inputPath).then(info => ({
            name: inputPath, start: info.size, end: info.size, saved: 0, ratio: 0
        }));
    }
    const outputPath = inputPath + ".gz";
    const input = fsBase.createReadStream(inputPath);
    const output = fsBase.createWriteStream(outputPath);
    // The Node.js docs say it would be more efficient to "cache the compressed buffer"
    // but don't indicate what that means or provide an example of the desired behavior.
    // I didn't do a lot of research, but the compression libraries I could find that
    // wrap this library (i.e. in the context of HTTP requests) ignore that advice.
    //
    // This is a script only called during builds and the number of files it has to
    // compress concurrently grows by the number of assets + entrypoints. I do not expect
    // this growth to become a problem.
    const gzip = zlib.createGzip({
        level: zlib.constants.Z_BEST_COMPRESSION,
    });
    return pipelinePromise(input, gzip, output)
        .then(() => ({
            name: inputPath,
            start: input.bytesRead,
            end: output.bytesWritten,
            saved: input.bytesRead - output.bytesWritten,
            ratio: 100 - Math.round((output.bytesWritten / input.bytesRead) * 100),
        }));
}

if (process.argv.length < 2) {
    console.error(process.argv);
    console.error("Usage: compress-all.ts <path>");
    process.exit(1);
}
const base = process.argv[process.argv.length - 1];

readFiles(base, "")
    .then(files => {
        return Promise.all(files.map(streamCompressFile));
    }).then((files) => {
        const results: any = [];
        let totalRatio = 0;
        let totalSaved = 0;
        let totalStart = 0;
        let totalEnd = 0;
        for (const { name, saved, start, end, ratio} of files) {
            results.push({
                name,
                start: scriptUtil.bytesToMetric(start),
                end: scriptUtil.bytesToMetric(end),
                saved: scriptUtil.bytesToMetric(saved),
                ratio: `${ratio}%`
            });
            totalRatio += ratio;
            totalSaved += saved;
            totalStart += start;
            totalEnd += end;
        }
        let averageRatio = Math.round(totalRatio / files.length);
        let averageSaved = Math.round(totalSaved / files.length);
        let averageStart = Math.round(totalStart / files.length);
        let averageEnd = Math.round(totalEnd / files.length);
        results.push({
            name: "average",
            start: scriptUtil.bytesToMetric(averageStart),
            end: scriptUtil.bytesToMetric(averageEnd),
            saved: scriptUtil.bytesToMetric(averageSaved),
            ratio: `${averageRatio}%`
        });
        results.push({
            name: "total",
            start: scriptUtil.bytesToMetric(totalStart),
            end: scriptUtil.bytesToMetric(totalEnd),
            saved: scriptUtil.bytesToMetric(totalSaved),
            ratio: `${100 - Math.round((totalEnd / totalStart) * 100)}%`
        });
        console.table(results, ['name', 'start', 'end', 'saved', 'ratio']);
    }).catch(err => console.error(err));
