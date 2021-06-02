import * as React from 'react';
import { ThemeProvider } from 'styled-components/macro';
import * as theme from 'theme';
import { render, fireEvent, screen } from '@testing-library/react';

import * as Event from 'event';
import * as eventTests from 'event/event.test';
import * as Player from 'player';
import * as playerTests from 'player/player.test';
import * as Share from 'share';

import EditEventMenu from './EditEventMenu';

export type RenderProps = {
    event: Event.DiceEvent,
    player?: Player.State,
    dispatch?: Event.Dispatch,
}
export function renderEditEventMenu(options: RenderProps) {
    const { event, player, dispatch } = options ?? {};
    if (!event) {
        throw Error("renderEditEventMenu: event required");
    }
    return render(
        <ThemeProvider theme={theme.default}>
            <Event.DispatchCtx.Provider value={dispatch}>
                <Player.Ctx.Provider value={player}>
                    <EditEventMenu event={event} />
                </Player.Ctx.Provider>
            </Event.DispatchCtx.Provider>
        </ThemeProvider>
    );
}

const getClose = () => screen.getByRole("button", { name: "close" });
const clickClose = () => fireEvent.click(getClose());

const getSubmit = () => screen.getByText("update", { selector: "button" });
const clickSubmit = () => fireEvent.click(getSubmit());

const mockEvent: Event.Roll = {
    ty: "roll", id: 221,
    source: { id: "plr", name: "Plrrr", share: Share.Mode.InGame },
    title: "This is the time. And this is the event of the time.",
    dice: [1, 2, 3], glitchy: 0,
};

//
// Close
//
describe('close button', function() {
    it("dispatches a cancel edit", async () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const player = playerTests.mockState();
        const event = mockEvent;
        renderEditEventMenu({ event, dispatch });
        await clickClose();

        expect(actions).toHaveLength(1);
        expect(actions[0].ty).toBe("clearEdit");
    });
});
