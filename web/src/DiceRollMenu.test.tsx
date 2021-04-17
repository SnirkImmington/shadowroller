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

const getDiceCount = () => screen.getByRole("textbox", { name: "Roll" });
const setDiceCount = (value: string) => fireEvent.change(getDiceCount(), { target: { value } });

const getRollTitle = () => screen.getByRole("textbox", { name: "to" });
const setRollTitle = (value: string) => fireEvent.change(getRollTitle(), { target: { value }});

const getLimitPush = () => screen.getByRole("checkbox", { name: "[ ] Push the limit" });
const toggleLimitPush = () => fireEvent.click(getLimitPush());

const getGlitchy = () => screen.getByRole("checkbox", { name: "[ ] Glitchy" });
const toggleGlitchy = () => fireEvent.click(getGlitchy());

const getGlitchiness = () => screen.getByRole("textbox", { name: /Reduce number of 1s/ });
const queryGlitchiness = () => screen.queryByRole("texbox", { name: /Reduce number of 1s/ });
const setGlitchiness = (value: string) => fireEvent.change(getGlitchiness(), { target: { value } });

const getRollSubmit = () => screen.getByText("Roll dice", { selector: "button" });
const submitRoll = () => fireEvent.click(getRollSubmit());

function validateCounts(values:[input: string, expected: boolean][]) {
    for (const [input, expected] of values) {
        it(`${expected ? "enables" : "disables"} roll button for ${input} dice`, async () => {
            renderRollMenu();

            await setDiceCount(input);

            const expectSubmit = expect(getRollSubmit());
            if (expected) {
                expectSubmit.toBeEnabled();
            }
            else {
                expectSubmit.toBeDisabled();
            }
        });
    }
}

//
// Roll button
//

it("does not enable roll button by default", () => {
    renderRollMenu();

    expect(getRollSubmit()).toBeDisabled();
});

describe("dice input validation", function() {
    validateCounts([
        ["0", false],
        ["1", true],
        ["-1", false],
        ["10", true],
        ["2 * 4", true],
        ["69", true],
    ]);
});

//
// Roll title
//

it("keeps the title in local roll", async () => {
    const [dispatch, actions] = eventTests.mockDispatch();
    const game: Game.State = null;
    renderRollMenu({ dispatch, actions, game });

    const rollTitle = "This is the roll. And this is the title of the roll.";

    await setDiceCount("1");
    await setRollTitle(rollTitle);
    expect(getRollSubmit()).toBeEnabled();

    await submitRoll();
    expect(actions).toHaveLength(1);
    const event: Event.Action = actions[0];
    expect(event.ty).toBe("newEvent");
    expect(event.event.title).toBe(rollTitle);
});

it("allows for roll with no title", async() => {
    const [dispatch, actions] = eventTests.mockDispatch();
    const game: Game.State = null;
    renderRollMenu({ dispatch, actions, game });

    await setDiceCount("1");
    await submitRoll();
    expect(actions).toHaveLength(1);
    const event: Event.Action = actions[0];
    expect(event.ty).toBe("newEvent");
    expect(event.event.title).toBe("");
});

//
// Push Limit
//

it("rolls with limit push", async () => {
    const [dispatch, actions] = eventTests.mockDispatch();
    const game: Game.State = null;
    renderRollMenu({ dispatch, actions, game });

    await setDiceCount("1");
    await toggleLimitPush();
    expect(getRollSubmit()).toBeEnabled();

    await submitRoll();
    expect(actions).toHaveLength(1);
    const event: Event.Action = actions[0];
    expect(event.ty).toBe("newEvent");
    expect(event.event.ty).toBe("edgeRoll");
});

//
// Glitchy
//

it("does not show glitchy level set by default", () => {
    renderRollMenu();

    expect(queryGlitchiness()).toBe(null);
});

it("rolls with glitchy starting at 1", async () => {
    const [dispatch, actions] = eventTests.mockDispatch();
    const game: Game.State = null;
    renderRollMenu({ dispatch, actions, game });

    await setDiceCount("1");
    await toggleGlitchy();
    expect(getRollSubmit()).toBeEnabled();

    await submitRoll();
    expect(actions).toHaveLength(1);
    const event: Event.Action = actions[0];
    expect(event.ty).toBe("newEvent");
    expect(event.event.glitchy).toBe(1);
});

it("rolls with set amount of glitchy", async () => {
    const [dispatch, actions] = eventTests.mockDispatch();
    const game: Game.State = null;
    renderRollMenu({ dispatch, actions, game });

    await setDiceCount("1");
    await toggleGlitchy();
    await setGlitchiness("1");
    expect(getRollSubmit()).toBeEnabled();

    await submitRoll();
    expect(actions).toHaveLength(1);
    const event: Event.Action = actions[0];
    expect(event.ty).toBe("newEvent");
    expect(event.event.glitchy).toBe(1);
});
