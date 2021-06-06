/** Space is the space to keep between elements. */
export enum Space {
    Tiny = "0.25rem",
    Small = "0.5rem",
    Med = "1rem",
    Large = "2rem"
}

/** This is the width history needs to be to see 8 dice. */
export const ROLLS_SMALL = 32;
/** This is the width history needs to be to see 12 dice. */
export const ROLLS_GOOD = 36;
/** This is the width history needs to be to see 16 dice. */
export const ROLLS_WIDE = 48;

/** This is width at which two components can be put next to each other in menus,
    which is the baseline for things looking okay. */
export const NARROW_MENU_MIN = 30;
/** This is the split at which point we can make menus wider and shorter to better
    make use of the available space. */
export const FULL_MENU_MIN = 42;
/** This is the maximum width our menus should stretch to. After that (and rolls
    are wide) we should start padding out the UI. */
export const WIDE_MENU_MIN = 56;

export const WIDE_MENU_MAX = 64;

export const breakpoints = {
};
export enum Breakpoint {
    /**
        Site is displayed with menus and history stacked.
        This is the minimum width to get two form elements to stack.
        Below this, many components need to render as columns and < 8 dice are shown.
    */
    Mobile = NARROW_MENU_MIN, // 30
    /**
        Site is displayed with wide menus and history stacked.
    */
    FullMenuStack = FULL_MENU_MIN, // 42
    WideMenuStack = WIDE_MENU_MIN, // 56
    /**
        Site is displayed with narrow menu next to 8-12 dice history.
        The rolls will grow past 8 dice, but wide menu kicks in
    */
    NarrowRow = NARROW_MENU_MIN + ROLLS_SMALL, // 62
    // NarrowMaxRolls = NARROW_MENU_MIN + ROLLS_WIDE, // 88
    WideSmallRolls = WIDE_MENU_MIN + ROLLS_SMALL, // 74
    /**
    */
    Wide = WIDE_MENU_MIN + ROLLS_GOOD, // 80
    Max = WIDE_MENU_MAX + ROLLS_WIDE, // 112
}

export const queries = {
    mobile: `@media screen and (min-width: ${Breakpoint.Mobile})`,
    narrow: `@media screen and (min-width: ${Breakpoint.NarrowRow})`,
    wide: `@media screen and (min-width: ${Breakpoint.Wide})`,
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
