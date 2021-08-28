export * from "./state";

export type Colors = {
    mode: "light"|"dark",
    /** High contrast color to display text with. */
    text: string,
    textSecondary: string,
    /** Background color. */
    background: string,
    backgroundSecondary: string,
    title: string,

    foregroundSaturation: number,
    foregroundLightness: number,

    backgroundSaturation: number,
    backgroundLightness: number,

    /** Primary color to display colored elements (i.e. titles) with. */
    primary: string,
    /** Secondary color to display colored elements (i.e. corner buttons) with. */
    secondary: string,
    light: string,
    /** Neutral color to display neutral elements (i.e. offline icon, regular dice) with. */
    neutral: string,
    /** Highlight color to display highlighted elements (i.e. GM status, blitz icon) with. */
    highlight: string,
    /** Color to display focused element with */
    outline: string,

    /** Color shown on successful dice */
    dieSuccess: string,
    /** Color shown on neutral dice */
    dieNeutral: string,
    /** Color shown on 1s */
    dieOne: string,

    /** Color used to indicate a player is online */
    indicatorOnline: string,
}
    /*
      primaryDisabled = neutral
      secondaryDisabled = neutral

      lightslategray = #778899 = hsl(210, 14%, 53%)
      neutral = #4e4e62 = hsl(240, 11%, 35%)
      pink = #9d0b64
    gray1: "#2b3137",
    primaryDesaturated: "#783442",
    primaryDesaturated2: "hsl(347, 24%, 60%)",
    offlineIcon: "#77727B",
     */

const light: Colors = {
    mode: "light",
    text: "#231f20", // "hsl(60, 75%, 3%)", // "#0e0e02",
    textSecondary: "hsl(60, 85%, 6%)",
    background: "hsl(0, 0%, 97%)", // "#ffffff", hsl(80, 80%, 56%)
    backgroundSecondary: "hsl(180, 10, 90%)",
    title: "#85142c", // "#231f20",

    foregroundSaturation: 75,
    foregroundLightness: 3,
    backgroundSaturation: 1,
    backgroundLightness: 100,

    primary: "#85142C",
    secondary: "#783422", // hsl(13, 56%, 30%)
    light: "#c1172c", // "#c14b4e",
    neutral: "#4e4e62", // hsl(240, 11%, 35%)
    highlight: "#9c9a63", // rgb(224, 221, 143), hsl(58, 57%, 72%)
    outline: "#9d9b64",

    dieSuccess: "#4d800e",
    dieNeutral: "#4e4e62",
    dieOne: "#85142C",

    indicatorOnline: "#33A736",
}

const dark: Colors = {
    mode: "dark",
    text: "hsl(180, 90%, 97%)", // almost "#f0ffff",
    textSecondary: "hsl(180, 100%, 95%)",
    background: "hsl(235, 11%, 8%)", // "#141824",
    backgroundSecondary: "hsl(200, 7%, 16%)",
    title: "#e0dd8f",

    foregroundSaturation: 90,
    foregroundLightness: 97,
    backgroundSaturation: 29,
    backgroundLightness: 11,

    primary: "hsl(349, 74%, 55%)", // #85142C = hsl(347, 74%, 30%)
    secondary: "#c64f52", // started "#783422",
    light: "#c1172c", // "#c14b4e",
    neutral: "hsl(44, 5%, 53%)",
    highlight: "#e0dd8f", // = rgb(224, 211, 143)
    outline: "#9d9b64",

    dieSuccess: "#14b826", //  "#75ca24", // "#4d800e", #9dcb64, rgb(224, 221, 143) eye
    dieNeutral: "#9aa",
    dieOne: "#c14b4e", // "#c14b4e",

    indicatorOnline: "#33A736" // lighten?
}

export type Theme = {
    colors: Colors,
    light: Colors,
    dark: Colors
}

const theme: Theme = {
    colors: dark,
    light,
    dark,
};

export default theme;
