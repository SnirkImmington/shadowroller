import * as React from 'react';
import styled from 'styled-components/macro';

import * as colorUtil from 'colorUtil';

type RecordProps = {
    style: any,
    hue: number|null|undefined,
    bg?: string,
    editing?: boolean
    //+eventDispatch: Event.Dispatch,
};

// Spacing between event records
const GUTTER_SIZE = 4;

export const StyledRecord = React.memo(styled.div.attrs<RecordProps>(
    props => {
        const style = {
            ...(props.style ?? {}),
            top: (props.style?.top + GUTTER_SIZE) || 0,
            height: (props.style?.height - GUTTER_SIZE) || 'auto',
        };
        if (props.editing) {
            style.backgroundColor = `hsl(${props.hue}, ${props.theme.colors.backgroundSaturation * 1.65}%, ${props.theme.colors.backgroundLightness * 0.75}%)`;
            //props.style.backgroundColor = props.color === "lightslategray" ?
            //    "#efefef" : props.color.replace("80%", "8%").replace("56%", "96%");
        }
        return { style };
})<RecordProps>`
    padding: 2px 2px 4px 6px;
    border-left: 5px solid ${({hue, theme}) => colorUtil.playerColor(hue, theme)};
    line-height: 1;
`);

export * from './Roll';
export * from './OtherEvents';
export { EdgeRoll } from './EdgeRoll';
export { Reroll } from './Reroll';
export { RollRecord as Roll } from './Roll';
export { Initiative } from './Initiative';
