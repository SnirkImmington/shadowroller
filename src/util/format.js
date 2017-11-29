// @flow

export type FormatMode =
| "abbrev"
| "title"
;

export default function format(name: string, mode: FormatMode): string {
    switch (mode) {
        case "abbrev":
            return name.slice(0, 3).toLocaleUpperCase();
        case "title":
            return name.split("-")
                        .map(word =>
                            word[0].toLocaleUpperCase() + word.slice(1))
                        .join(" ");
        default:
            return name;
    }
}
