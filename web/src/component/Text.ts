import * as React from 'react';
import styled from 'styled-components/macro';

import * as colorUtil from 'colorUtil';

export type FlavorProps = React.PropsWithChildren<{
    /** warn indicates this flavortext is meant to convey an error message. */
    warn?: boolean,
}>;

/** Text.Flavor is a text component for text which is meant to be stylistic. */
export const Flavor = styled.i<FlavorProps>(({ theme, warn }) => ({
    color: warn ? theme.colors.highlight : theme.colors.textSecondary
}));


export type PlayerProps = {
    /** Hue is the hue of the given player, defaulting to a theme color
        when player color is not available (if the player is not logged in). */
    hue: number | null | undefined
};

export const Player = styled.b<PlayerProps>(({ hue, theme }) => ({
    whiteSpace: "nowrap",
    color: colorUtil.playerColor(hue, theme)
}));

/** Text.Small is the smaller size of text, for minor details. */
export const Small = styled.span(({ theme }) => ({
    whiteSpace: "nowrap",
    fontSize: ".75rem",
    lineHeight: "1rem",
    color: theme.colors.textSecondary,
}));
