import 'styled-components';
import theme from 'style/theme';

declare module 'styled-components' {
    export interface DefaultTheme {
        colors: {
            primary: string,
            primaryLight: string,
            primaryDesaturated: string,
            primaryDesaturated3: string,

            gray1: string,

            secondary: string,
            secondaryDark: string,
            dieOne: string,
            dieHit: string,
            dieNone: string,

            warning: string,

            header: string
        },
        fonts: {
            monospace: string
        }
    };
}
