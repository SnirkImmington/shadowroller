import * as React from 'react';

import theme from 'theme';

// ColorCtx is the player color that we use to accent parts of the UI.
export const ColorCtx = React.createContext<string>(theme.colors.secondary); // TODO
