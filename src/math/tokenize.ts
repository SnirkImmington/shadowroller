export type Token =
| { type: "done" }
| { type: "symbol", value: string }
| { type: "number", value: number }
;

export class Tokenizer {
    text: string;
    position: number;

    constructor(text: string) {
        this.text = text;
        this.position = 0;
    }

    next = (): Token | null => {
        if (this.position >= this.text.length) {
            return { type: "done" };
        }
        let nextChar: string = this.text[this.position];
        this.position++;
        // Skip over spaces at the start of `next()`.
        while (nextChar === ' ' || nextChar === '\t') {
            nextChar = this.text[this.position];
            this.position++;
        }
        // It's a number.
        if (!isNaN(nextChar as any) || nextChar === '.') {
            const numberChars: string[] = [nextChar];
            // Keep taking number characters until we hit a non-
            // number or EOF.
            while (this.position < this.text.length + 1) {
                const peeked = this.text[this.position];
                if (peeked == null) {
                    break;
                }
                else if (!isNaN(peeked as any) || peeked === '.') {
                    // If we have another number char (a 2+ digit number),
                    // append it to the array.
                    numberChars.push(peeked);
                    this.position++;
                }
                // Ignore underscores or commas used as separators.
                else if (peeked === '_' || peeked === ',') {
                    this.position++;
                }
                else {
                    // Otherwise, we have a character that's not a number.
                    break;
                }
            }
            const numberText: string = numberChars.join("");
            const numberValue = parseFloat(numberText);
            if (!isNaN(numberValue)) {
                return { type: "number", value: numberValue };
            }
            else {
                return null;
            }
        }
        switch (nextChar) {
            case '(':  case ')':
            case '+': case '-':
            case '*': case '/':
            case '^':
                return { type: "symbol", value: nextChar };
            default:
                return null;
        }
    }
}
