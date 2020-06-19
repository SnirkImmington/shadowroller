// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import * as dice from 'dice';

import * as Event from 'event';


type RecordProps = { +style: any, children: any };

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
