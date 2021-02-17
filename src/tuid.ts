export type TUID = number;

const TUID_TS_MULTIPLIER = 100;
const TUID_NOISE_BYTES = 2;
const TUID_NOISE_SHIFT = TUID_NOISE_BYTES * 8;
const TUID_NOISE_MAX = 2 ^ TUID_NOISE_SHIFT;
// const TUID_NOISE_SUB = 1 << TUID_NOISE_SHIFT;

function tuidNoise() {
    return Math.floor(Math.random() * TUID_NOISE_MAX);
}

export function buildTUID(ts: number, noise: number): TUID {
    const decis = ts / TUID_TS_MULTIPLIER;
    return (decis << TUID_NOISE_SHIFT) + noise;
}

export function newTUID(): TUID {
    return buildTUID(tuidNoise(), new Date().valueOf());
}
