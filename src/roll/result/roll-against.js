// @flow

import RollResult from './roll-result';

export default class RollAgainstResult {
    userRoll: RollResult;
    foeRoll: RollResult;
    userNetHits: number;
    mode: 'roll-against';

    constructor(userRoll: RollResult, foeRoll: RollResult) {
        this.mode = 'roll-against';
        this.userRoll = userRoll;
        this.foeRoll = foeRoll;

        this.userNetHits = userRoll.getHits() - foeRoll.getHits();

    }

    successful(): boolean {
        return this.userNetHits >= 0;
    }

    netHits(): number {
        return this.userNetHits;
    }

    toString(): string {
        let result: string;
        if (this.successful()) {
            result = "Success! User got ";
            result += this.userNetHits;
            result += (this.userNetHits === 1 ? " net hit!" : " net hits!");
            if (this.userRoll.isGlitched()) {
                result += " However, user ";
                result += (this.userRoll.isCrit() ?
                    "critial glitched with " : " glitched with ");
                result += this.userRoll.misses;
                result += this.userRoll.misses === 1 ? " miss" : " misses";
                if (this.foeRoll.isGlitched()) {
                    result += ", and the foe ";
                    result += (this.foeRoll.isCrit() ?
                        "critical glitched with " : "glitched with ");
                    result += this.foeRoll.misses;
                    result += (this.foeRoll.misses === 1 ? " miss" : " misses");
                }
            }
            else if (this.foeRoll.isGlitched()) {
                result += " Additionally, the foe ";
                result += (this.foeRoll.isCrit() ?
                    "critical glitched with " : "glitched with ");
                result += this.foeRoll.getMisses();
                result += (this.foeRoll.misses === 1 ? " miss" : " misses");
            }
        }
        else {
            result = "Failure! User behind by ";
            result += (-this.userNetHits);
            result += (this.userNetHits === -1 ? " net hit!" : " net hits!")
            if (this.userRoll.isGlitched()) {
                result += " Also, user ";
                result += (this.userRoll.isCrit() ?
                    "critial glitched with " : " glitched with ");
                result += this.userRoll.misses;
                result += this.userRoll.misses === 1 ? " miss" : " misses";
                if (this.foeRoll.isGlitched()) {
                    result += ", and the foe ";
                    result += (this.foeRoll.isCrit() ?
                        "critical glitched with " : "glitched with ");
                    result += this.foeRoll.misses;
                    result += (this.foeRoll.misses === 1 ? " miss" : " misses");
                }
            }
            else if (this.foeRoll.isGlitched()) {
                result += " Forunately, the foe ";
                result += (this.foeRoll.isCrit() ?
                    "critical glitched with " : "glitched with ");
                result += this.foeRoll.misses;
                result += (this.foeRoll.misses === 1 ? " miss" : " misses");
            }
        }

        return result;
    }
}
