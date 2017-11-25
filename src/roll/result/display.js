// @flow

import type { DisplayMode } from '..';

export default class DisplayResult {
    mode: 'display';
    displayMode: DisplayMode;
    dice: number[];
    highlighted: number;

    constructor(dice: number[], displayMode: DisplayMode) {
        this.mode = "display";
        this.displayMode = displayMode;
        this.dice = dice;

        let diceToSort = [...dice];
        diceToSort.sort();

        if (displayMode === 'max') {
            this.highlighted = diceToSort[dice.length - 1];
        }
        else if (displayMode === 'min') {
            this.highlighted = diceToSort[0];
        }
        else {
            this.highlighted = dice[0];
        }
    }
}
