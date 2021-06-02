import type { Colors, Theme } from 'theme';

/** The color a player should have for the given hue */
export function playerColor(hue: number|null|undefined, theme?: Theme): string {
    if (hue || hue === 0) {
        return `hsl(${hue}, 80%, 56%)`;
    }
    if (theme) {
        return theme.colors.highlight;
    }
    return "lightslategray";
}

export function hueBackground(hue: number, colors: Colors): string {
    const saturation = colors.backgroundSaturation * 0.7;
    const lightness = colors.backgroundLightness * 1.2;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
