
// bytesToMetric produces a human-readable representation of a number of bytes.
export function bytesToMetric(bytes: number): string {
    const bytesInMib = Math.pow(1024, 2);
    const bytesInKib = Math.pow(1024, 1);

    if (bytes > bytesInMib) {
        return `${(bytes / bytesInMib).toFixed(2)}MiB`;
    } else if (bytes > bytesInKib) {
        return `${(bytes / bytesInKib).toFixed(2)}KiB`;
    }
    return `${bytes} bytes`;
}
