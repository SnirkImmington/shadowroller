import * as React from "react";
import styled from 'styled-components/macro';

type Props = {
    /** Render-stable setter which will be called with the component's child's
     * height (plus padding) whenever a new child is rendered. */
    setHeight: (height: number) => void;

    style: React.CSSProperties;
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
    const ref = React.useRef<HTMLDivElement>(null!);
    React.useEffect(() => {
        const node = ref.current;
        if (!node) {
            return;
        }
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const height = Math.round(entry.contentRect.height);
                if (height === 0) {
                } else {
                    setHeight(height + 6);
                }
            }
        });
        observer.observe(node);
        return observer.disconnect.bind(observer);
    }, [setHeight]);

    delete style.height;

    return (
        <StyledPadding ref={ref} style={style}>
            {children}
        </StyledPadding>
    );
};
