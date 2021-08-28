/** Space is the space to keep between elements. */
export enum Space {
    Tiny = "0.25rem",
    Small = "0.5rem",
    Med = "1rem",
    Large = "2rem"
}

/** This is the width history needs to be to see 8 dice. */
export const ROLLS_SMALL = 32;
/** This is the width history needs to be to see 16 dice. */
export const ROLLS_WIDE = 52;

/** This is width at which two components can be put next to each other in menus,
    which is the baseline for things looking okay. */
export const MENU_MIN = 26;
/** This is the maximum width we need the wide menus to be. */
export const MENU_MAX = 64;

export const COLUMNS_BREAKPOINT = MENU_MIN + ROLLS_SMALL;
export const MAX_BREAKPOINT = MENU_MAX + ROLLS_WIDE;

export const Media = {
    Columns: `@media all and (min-width: ${COLUMNS_BREAKPOINT * 16}px)`,
    ColumnsMax: `@media all and (min-width: ${MAX_BREAKPOINT * 16}px)`,
}

export enum FontSize {
    Small = "0.75rem",
    Regular = "1rem",
    Emphasis = "1.25rem",
    Title = "1.5rem",
    DiceBase = "4rem"
}

export enum Fonts {
    Monospace = "'Source Code Pro', menlo, calibri, monospace",
}
