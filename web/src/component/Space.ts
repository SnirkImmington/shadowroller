import styled from 'styled-components/macro';

import * as layout from 'layout';

/** FlexGrow creates a spacer that will cause the next item in a row to float
    right if it has space, or wrap to the next row if its parent has flex wrap.*/
export const FlexGrow = styled.div({
    flexGrow: 1
});

export const MaxWidth = styled.div({
    width: "100%"
});

/** Below applies padding below the component. */
export const Below = styled.div({
    paddingBottom: layout.Space.Med,
});

/** InputRow spaces the given components to line up with a text input field. */
export const InputRow = styled.div({
    display: "flex",
    minHeight: "calc(1rem + 10px)",
    alignItems: "center",
});

export const FormRow = styled.div({
    display: "flex",
    minHeight: "1.5rem",
});
