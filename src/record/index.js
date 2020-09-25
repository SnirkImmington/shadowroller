// @flow

import styled from 'styled-components/macro';
import * as UI from 'style';
import type { StyledComponent } from 'styled-components';

type RecordProps = {
    +style: any,
    +color: string,
    //+eventDispatch: Event.Dispatch,
};

// Spacing between event records
const GUTTER_SIZE = 4;

export const StyledRecord: StyledComponent<RecordProps> = styled.div.attrs(
    props => {
        const style = {
            ...props.style,
            top: props.style.top + GUTTER_SIZE,
            height: props.style.height - GUTTER_SIZE,
        };
        return { style };
})`
    padding-bottom: 4px;
    padding-left: 5px;
    padding-right: 2px;
    ${({color}) =>
        `border-left: 5px solid ${color};`
    }
    line-height: 1;
`;

export * from './roll';
export * from './otherEvents';
export { EdgeRoll } from './edgeRoll';
export { Reroll } from './reroll';
export { RollRecord as Roll } from './roll';
