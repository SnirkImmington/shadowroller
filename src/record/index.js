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

export const StyledRecord: StyledComponent<RecordProps> = styled(UI.FlexColumn).attrs(
    props => {
        console.log("StyledRecord", props, props.style.height);
        // So we get an initial height which we need to not pass through.
        if (props.style.height == 69) {
            delete props.style.height;
            return {
                ...props.style,
            };
        }
        console.log(props.style)
        const style = {
            ...props.style,
            height: props.style.height - GUTTER_SIZE,
            bottom: props.style.bottom - GUTTER_SIZE,
        };
        return { style };
})`
    padding-left: 5px;
    ${({color}) =>
        `border-left: 5px solid ${color};`
    }
    line-height: 1;
`;

export * from './roll';
export * from './otherEvents';
