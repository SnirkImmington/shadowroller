import * as React from 'react';

import styled, { CSSObject } from 'styled-components/macro';

import * as colorUtil from 'colorUtil';

type RecordProps = {
    style: any,
    hue: number|null|undefined,
    bg?: string,
    editing?: boolean
    //+eventDispatch: Event.Dispatch,
};

type PaddingProps = {
    hue: number|null|undefined,
    highlight: boolean,
}

// Spacing between event records
const GUTTER_SIZE = 4;

export const StyledRecord = React.memo(styled.div<RecordProps>(({ style, hue, bg, editing, theme }) => {
    const styles: CSSObject = {};
    if (style) {
        //Object.assign(styles, style);
    }
    styles.lineHeight = 1;
    if (editing) {
        const saturation = theme.colors.backgroundSaturation * 1.65;
        const lightness = theme.colors.backgroundLightness * 0.75;
        styles.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
    return styles;
}));

export const RecordPadding = styled.div<PaddingProps>(({ hue, highlight, theme }) => ({
    borderLeft: `5px solid ${colorUtil.playerColor(hue, theme)}`,
    padding: `2px 0.25rem 0.25rem 0.25rem`,
    backgroundColor: highlight ? theme.colors.backgroundSecondary : ""
}));

export * from './Roll';
export * from './OtherEvents';
export { EdgeRoll } from './EdgeRoll';
export { Reroll } from './Reroll';
export { RollRecord as Roll } from './Roll';
export { Initiative } from './Initiative';
