// @flow

export default function capitalize(input: string): string {
    return input[0].toLocaleUpperCase() + input.slice(1).toLocaleUpperCase();
}
