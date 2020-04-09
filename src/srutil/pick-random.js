// @flow

/** Pick a random member of an array. Only used for flavortext. */
export default function pickRandom<T>(items: Array<T>): T {
    return items[Math.floor(Math.random() * items.length)];
}
