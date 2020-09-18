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
    props => ({
        style: {
            ...props.style,
            height: props.style.height - GUTTER_SIZE,
            bottom: props.style.bottom - GUTTER_SIZE,
        }
    })
)`
    padding-left: 5px;
    ${({color}) =>
        `border-left: 5px solid ${color};`
    }
    line-height: 1;
`;

export * from './roll';
export * from './otherEvents';
