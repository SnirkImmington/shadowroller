// @flow

export default function pickRandom<T>(items: Array<T>): T {
    return items[Math.floor(Math.random() * items.length)];
}
