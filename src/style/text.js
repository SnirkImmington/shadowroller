// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import theme from 'style/theme';

export const SmallText: StyledComponent<{}, typeof theme> = styled.div`
    white-space: nowrap;
    font-size: .6rem;
    line-height: 1rem;
    filter: brightness(70%);
    color: ${({theme}) => theme.colors.gray1};
`;
