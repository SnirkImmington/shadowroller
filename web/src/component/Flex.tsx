import * as React from 'react';
import styled from 'styled-components/macro';
import { flex, space, layout } from 'styled-system';

export const Row = styled.div({
    display: "flex",
    minWidth: 0,
}, flex, space, layout);

export const Column = styled(Row)({
    flexDirection: "column",
});

export const FormRow = styled(Row)(props => ({
    marginBottom: props.theme.space.small,
}));

const FormPadded = styled.div(props => ({
    marginBottom: props.theme.space.small,
    marginRight: props.theme.space.small,
}));

export const FormColumn = styled(Column)(props => ({

}));
