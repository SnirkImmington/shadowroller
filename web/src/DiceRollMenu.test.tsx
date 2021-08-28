import { ThemeProvider } from 'styled-components/macro';
import * as theme from 'theme';
import { render, fireEvent, screen } from '@testing-library/react';

import * as Event from 'event';
import * as eventTests from 'event/event.test';
import * as Game from 'game';
//import * as gameTests from 'game/game.test';

import DiceRollMenu from './DiceRollMenu';

export type RenderOptions = {
    game: Game.State,
    dispatch: Event.Dispatch,
}
export function renderRollMenu(options?: RenderOptions) {
    const { game, dispatch } = options ?? { game: null, dispatch: () => {} };
    return render(
        <ThemeProvider theme={theme.default}>
            <Event.DispatchCtx.Provider value={dispatch}>
                <Game.Ctx.Provider value={game}>
                    <DiceRollMenu />
                </Game.Ctx.Provider>
            </Event.DispatchCtx.Provider>
        </ThemeProvider>
    );
}

const getHide = () => screen.getByRole("button", { name: "hide" });
const clickHide = () => fireEvent.click(getHide());
const getShow = () => screen.getByRole("button", { name: "show" });
const clickShow = () => fireEvent.click(getShow());

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

const getRollSubmit = () => screen.getByRole("button", { name: "Roll dice" });
const submitRoll = () => fireEvent.click(getRollSubmit());

function validateCounts(values:[input: string, expected: boolean][]) {
    for (const [input, expected] of values) {
        it(`${expected ? "enables" : "disables"} roll button for ${input} dice`, () => {
            renderRollMenu();

            setDiceCount(input);

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
// Hide
//
describe('hide button', function() {
    it("hides when toggled", () => {
        renderRollMenu();
        clickHide();

        expect(screen.queryByRole("textbox")).toBeNull();
    });

    it("unhides when toggled again", () => {
        renderRollMenu();
        clickHide();
        clickShow();

        expect(getRollTitle()).not.toBeNull();
        expect(getRollSubmit()).not.toBeNull();
    });
});

//
// Roll button
//
describe("roll button enabled", function() {
    it("does not enable roll button by default", () => {
        renderRollMenu();

        expect(getRollSubmit()).toBeDisabled();
    });

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
describe("roll title", function() {
    it("keeps the title in local roll", () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderRollMenu({ dispatch, game });

        const rollTitle = "This is the roll. And this is the title of the roll.";

        setDiceCount("1");
        setRollTitle(rollTitle);
        expect(getRollSubmit()).toBeEnabled();

        submitRoll();
        expect(actions).toHaveLength(1);
        const action: any = actions[0];
        expect(action.ty).toBe("newEvent");
        expect(action.event.title).toBe(rollTitle);
    });

    it("allows for roll with no title", () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderRollMenu({ dispatch, game });

        setDiceCount("1");
        submitRoll();
        expect(actions).toHaveLength(1);
        const action: any = actions[0];
        expect(action.ty).toBe("newEvent");
        expect(action.event.title).toBe("");
    });
});

//
// Push Limit
//
describe("push the limit", function() {
    it("rolls with limit push", () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderRollMenu({ dispatch, game });

        setDiceCount("1");
        toggleLimitPush();
        expect(getRollSubmit()).toBeEnabled();

        submitRoll();
        expect(actions).toHaveLength(1);
        const action: any = actions[0];
        expect(action.ty).toBe("newEvent");
        expect(action.event.ty).toBe("edgeRoll");
    });
});

//
// Glitchy
//
describe("glitchy", function() {
    it("does not show glitchy level set by default", () => {
        renderRollMenu();

        expect(queryGlitchiness()).toBe(null);
    });

    it("rolls with glitchy starting at 1", () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderRollMenu({ dispatch, game });

        setDiceCount("1");
        toggleGlitchy();
        expect(getRollSubmit()).toBeEnabled();

        submitRoll();
        expect(actions).toHaveLength(1);
        const action: any = actions[0];
        expect(action.ty).toBe("newEvent");
        expect(action.event.glitchy).toBe(1);
    });

    it("rolls with set amount of glitchy", () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderRollMenu({ dispatch, game });

        setDiceCount("1");
        toggleGlitchy();
        setGlitchiness("1");
        expect(getRollSubmit()).toBeEnabled();

        submitRoll();
        expect(actions).toHaveLength(1);
        const action: any = actions[0];
        expect(action.ty).toBe("newEvent");
        expect(action.event.glitchy).toBe(1);
    });
});
