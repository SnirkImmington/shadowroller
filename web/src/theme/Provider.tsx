import * as React from 'react';
import { ThemeProvider } from 'styled-components/macro';

import * as theme from './index';
import * as layout from 'layout';

export default function Provider(props: React.PropsWithChildren<{}>) {
    const [themeMode, setThemeMode] = React.useState<theme.Mode>(theme.defaultMode);

    const [menuMode, setMenuMode] = React.useState<null|"narrow"|"full"|"wide">(null);

    React.useEffect(() => {
        const mobile = window.matchMedia(layout.menuQueries.mobile);
        console.log('Mobile', mobile, layout.menuQueries.mobile);
        function setMobileIfMatched(e: MediaQueryList|MediaQueryListEvent) {
            if (e.matches) {
                if (process.env.NODE_ENV === "development") {
                    console.log("Found mobile menu mode");
                }
                setMenuMode("narrow");
            } else {
                setMenuMode(m => m === "narrow" ? null : m);
                console.log("Mobile: no match", e);
            }
        }
        const full = window.matchMedia(layout.menuQueries.full);
        console.log('Full', full, layout.menuQueries.full);
        function setFullIfMatched(e: MediaQueryList|MediaQueryListEvent) {
            if (e.matches) {
                if (process.env.NODE_ENV === "development") {
                    console.log("Found full menu mode");
                }
                setMenuMode("full");
            } else {
                console.log("Full: no match", e);
            }
        }
        const wide = window.matchMedia(layout.menuQueries.wide);
        console.log('Wide', wide, layout.menuQueries.wide);
        function setWideIfMatched(e: MediaQueryList|MediaQueryListEvent) {
            if (e.matches) {
                if (process.env.NODE_ENV === "development") {
                    console.log("Found wide menu mode");
                }
                setMenuMode("wide");
            } else {
                console.log("Wide: no match", e);
            }
        }

        setMobileIfMatched(mobile);
        mobile.addEventListener("change", setMobileIfMatched);
        setFullIfMatched(full);
        full.addEventListener("change", setFullIfMatched);
        setWideIfMatched(wide);
        wide.addEventListener("change", setWideIfMatched);

        return () => {
            mobile.removeEventListener("change", setMobileIfMatched);
            full.removeEventListener("change", setFullIfMatched);
            wide.removeEventListener("change", setWideIfMatched);
        };
    }, [setMenuMode]); // only on startup

    const appliedTheme = {
        ...theme.default,
        colors: themeMode === "light" ? theme.default.light : theme.default.dark
    };

    return (
        <ThemeProvider theme={appliedTheme}>{props.children}</ThemeProvider>
    )
}
