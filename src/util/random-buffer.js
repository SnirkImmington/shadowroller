// @flow

const RANDOM_ORG_URL = '';
const FETCH_BUFFER = 200;

function parseRandomOrgReply(text: string): number[] {
    const result: number[] = text.split(/\s/, FETCH_BUFFER)
                            .filter((result) => !isNaN(parseInt(result, 10)))
                            .map(result => parseInt(result, 10));
    return result;
}

export default class RandomBuffer {
    onFillRequired: () => void;
    onFillCompleted: () => void;
    buffer: number[];

    constructor(onFillRequired: () => void, onFillCompleted: () => void) {
        this.buffer = [];
        this.onFillRequired = onFillRequired;
        this.onFillCompleted = onFillCompleted;
    }

    fillRequired(count: number): bool {
        console.log("Checking fill required for buffer " + this.buffer.length + " against " + count);
        const result = this.buffer.length <= count;
        console.log(result);
        return result;
    }

    requestRolls(count: number): ?number[] {
        if (this.fillRequired(count)) {
            console.log("Getting some randoms.");
            this.onFillRequired();
            this.fillBuffer();
            return null;
        }
        const result = this.buffer.splice(this.buffer.length - count, count);
        if (this.buffer.length === 0) {
            this.onFillRequired();
            this.fillBuffer();
        }
        return result;
    }

    ensureLimit(count: number): boolean {
        if (this.fillRequired(count)) {
            this.fillBuffer();
            return true;
        }
        else {
            return false;
        }
    }

    fillBuffer(): void {
        const request = new XMLHttpRequest();
        const _this = this;
        request.onreadystatechange = function() {
            if (request.readyState === 4 && request.status === 200) {
                const new_numbers: number[] = parseRandomOrgReply(request.responseText);
                _this.buffer.push(...new_numbers);
                _this.onFillCompleted();
            }
        }
        request.open("GET", RANDOM_ORG_URL, true);
        request.send();
    }
}
