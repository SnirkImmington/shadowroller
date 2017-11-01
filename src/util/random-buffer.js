// @flow

const FETCH_BUFFER = 200;

const RANDOM_ORG_URL = "https://www.random.org/integers/?num=" + FETCH_BUFFER + "&min=1&max=6&col=1&base=10&format=plain&rnd=new";

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
        this.buffer = new Array(FETCH_BUFFER);
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

    checkForLimit(count: number): boolean {
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
            if (this.readyState === 4 && this.status === 200) {
                const new_numbers: number[] = parseRandomOrgReply(this.responseText);
                _this.buffer.push(...new_numbers);
                _this.onFillCompleted();
            }
        }
        request.open("GET", RANDOM_ORG_URL, true);
        request.send();
    }
}
