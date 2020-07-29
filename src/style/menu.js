// @flow

import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';

import { ColumnToRow } from './';

export const Menu: StyledComponent<> = styled.div`
    background-color: ${props=>props.theme.colors.gray2};
    color: white;
    padding: 0.5em;

    @media all and (min-width: 768px) {
        padding: 0.5em 2em;
    }
`;

export const MenuBody: StyledComponent<> = styled(ColumnToRow)`
    @media all and (min-width: 768px) {
        justify-content: center;
        align-items: center;
    }
`;
