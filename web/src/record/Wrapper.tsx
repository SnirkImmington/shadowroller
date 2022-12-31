import styled from 'styled-components/macro';

import * as colorUtil from 'colorUtil';

type PaddingProps = {
    hue: number | null | undefined,
    highlight: boolean,
};

/*
export const StyledRecord = React.memo(styled.div<RecordProps>(({ style, hue, bg, editing, theme }) => {
    const styles: CSSObject = {};
    if (style) {
        //Object.assign(styles, style);
    }
    styles.lineHeight = 1;
    if (editing) {
        const saturation = theme.colors.backgroundSaturation * 1.65;
        const lightness = theme.colors.backgroundLightness * 0.75;
        styles.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
    return styles;
}));
*/

/** Wrapper produces the left-aligned colored indicator and small amounts of padding
 * around the event
 */
export default styled.div<PaddingProps>(({ hue, highlight, theme }) => ({
    borderLeft: `5px solid ${colorUtil.playerColor(hue, theme)}`,
    padding: `2px 0.25rem 0.25rem 0.25rem`,
    backgroundColor: highlight ? theme.colors.backgroundSecondary : ""
}));
