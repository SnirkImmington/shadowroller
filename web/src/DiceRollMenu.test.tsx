import * as React from 'react';
import { ThemeProvider } from 'styled-components/macro';
import theme from 'style/theme';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';

import * as Event from 'event';
import * as eventTests from 'event/test';
import * as Game from 'game';
import * as gameTests from 'game/test';
import DiceRollMenu from './DiceRollMenu';

type RenderOptions = {
    game?: Game.State,
    dispatch?: Event.Dispatch,
}
function renderRollMenu(options?: RenderOptions) {
    const { game, dispatch } = options ?? {};
    return render(
        <ThemeProvider theme={theme}>
            <Event.DispatchCtx.Provider value={dispatch}>
                <Game.Ctx.Provider value={game}>
                    <DiceRollMenu />
                </Game.Ctx.Provider>
            </Event.DispatchCtx.Provider>
        </ThemeProvider>
    );
}

const getDiceCount = () => screen.getByLabelText("Calculator");

const getRollSubmit = () => screen.getByText(/Roll dice/i, { selector: "button" });

it("does not enable roll button by default", async () => {
    renderRollMenu();

    expect(getRollSubmit()).toBeDisabled();
});


it("enables button when dice is set", async () => {
    renderRollMenu();

    await fireEvent.change(getDiceCount(), { target: { value: "12" } });

    expect(getRollSubmit()).toBeEnabled();

});
