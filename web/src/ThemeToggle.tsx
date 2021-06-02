import * as React from 'react';
import { ThemeContext } from 'styled-components/macro';
import * as UI from 'style';
import * as icons from 'style/icon';

import * as theme from 'theme';

export default function ThemeToggle() {
    const themeValues = React.useContext(ThemeContext);
    const mode = React.useContext(theme.Ctx);
    const setMode = React.useContext(theme.DispatchCtx);

    const onChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setMode("light");
        } else {
            setMode("dark");
        }
    }, [setMode]);

    return (
        <UI.FlexRow>
            <UI.RadioLink type="checkbox" id="toggle-light-mode" checked={mode==="light"} onChange={onChange}>
                <UI.TextWithIcon color={themeValues.colors.highlight}>
                    <UI.FAIcon icon={icons.faSun} transform="grow-3" />
                </UI.TextWithIcon>
            </UI.RadioLink>
        </UI.FlexRow>
    );
}
