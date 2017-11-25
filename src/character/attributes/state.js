// @flow

import type { Attribute } from '.';
import { ATTRIBUTES } from '.';

export type AttributesState = {
    [Attribute]: number,
};

let attributes = {};
for (const attr of Object.keys(ATTRIBUTES)) {
    attributes[attr] = ATTRIBUTES[attr].default;
}

export const DEFAULT_ATTRIBUTES_STATE: AttributesState = attributes;

function baseLimitCalc(a: number, b: number, c: number): number {
    return Math.ceil(((a * 2) + b + c) / 3);
}

export function mentalLimit(attr: AttributesState): number {
    return baseLimitCalc(attr['logic'], attr['intuition'], attr['willpower']);
}

export function physicalLimit(attr: AttributesState): number {
    return baseLimitCalc(attr['strength'], attr['body'], attr['reaction'])
}

export function socialLimit(attr: AttributesState): number {
    return baseLimitCalc(attr['charisma'], attr['willpower'], attr['essence']);
}

export function initativeBase(attr: AttributesState): number {
    return attr['intuition'] + attr['reaction'];
}

export function initiativeDice(): number { return 1; }

export function physicalHP(attr: AttributesState): number {
    return Math.ceil((attr['body'] / 2) + 8);
}

export function stunHP(attr: AttributesState): number {
    return Math.ceil((attr['willpower'] / 2) + 8);
}

export function overflowMax(attr: AttributesState): number {
    return attr['body'];
}
