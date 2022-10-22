import * as React from "react";
import styled from 'styled-components/macro';

type Props = {
    /** Render-stable setter which will be called with the component's child's
     * height (plus padding) whenever a new child is rendered. */
    setHeight: (height: number) => void;

    style: React.StyleHTMLAttributes<HTMLDivElement>;
};

/** Padding to separate items in the list */
const StyledPadding = styled.div({
    padding: `2px 0.25rem 0.25rem 0.25rem`,
});

/** An item in a horizontal list which will report its height to its parent.
 * Ensure that `setHeight` does not change between renders of this component,
 * i.e., get it from `useState`.
 *
 * Using the "rudimentary" way to measure the size of a DOM node from the React
 * docs: https://reactjs.org/docs/hooks-faq.html#how-can-i-measure-a-dom-node
 *
*/
export default function ListItem({ setHeight, children, style }: React.PropsWithChildren<Props>) {
    console.log("Render ListItem", style);

    const onRender = React.useCallback((node: HTMLDivElement | null) => {
        if (node) {
            console.log("onRender(", node, ")");
            setHeight(Math.round(node.getBoundingClientRect().height));
        } else {
            console.log("onRender(null)");
        }
    }, [setHeight]);

    return (
        <StyledPadding ref={onRender} style={style}>
            {children}
        </StyledPadding>
    );
};
