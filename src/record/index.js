// @flow

import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';

type RecordProps = {
    +style: any,
    +color: string,
    //+eventDispatch: Event.Dispatch,
};

// Spacing between event records
const GUTTER_SIZE = 4;

export const StyledRecord: StyledComponent<RecordProps> = styled.div.attrs(
    props => ({
        style: {
            ...props.style,
            top: props.style.top + GUTTER_SIZE,
            height: props.style.height - GUTTER_SIZE,
        }
    })
)`
    padding: 4px;
    ${({color}) =>
        `border-left: 4px solid ${color};`
    }
`;

export * from './roll';
export * from './otherEvents';
