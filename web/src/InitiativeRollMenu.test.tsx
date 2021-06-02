import * as React from 'react';
import { ThemeProvider } from 'styled-components/macro';
import * as theme from 'theme';
import { render, fireEvent, screen } from '@testing-library/react';

import * as Event from 'event';
import * as eventTests from 'event/event.test';
import * as Game from 'game';
import * as gameTests from 'game/game.test';

import InitiativeRollMenu from './InitiativeRollMenu';

export type RenderOptions = {
    game?: Game.State,
    dispatch?: Event.Dispatch,
}
export function renderInitiativeMenu(options?: RenderOptions) {
    const { game, dispatch } = options ?? {};
    return render(
        <ThemeProvider theme={theme.default}>
            <Event.DispatchCtx.Provider value={dispatch}>
                <Game.Ctx.Provider value={game}>
                    <InitiativeRollMenu />
                </Game.Ctx.Provider>
            </Event.DispatchCtx.Provider>
        </ThemeProvider>
    );
}

const getHide = () => screen.getByRole("button", { name: "hide" });
const clickHide = () => fireEvent.click(getHide());
const getShow = () => screen.getByRole("button", { name: "show" });
const clickShow = () => fireEvent.click(getShow());

const getBase = () => screen.getByRole("textbox", { name: "Roll" });
const setBase = (value: string) => fireEvent.change(getBase(), { target: { value } });

const getDice = () => screen.getByRole("textbox", { name: "d6" });
const setDice = (value: string) => fireEvent.change(getDice(), { target: { value } });

const getTitle = () => screen.getByRole("textbox", { name: "" });
const setTitle = (value: string) => fireEvent.change(getTitle(), { target: { value }});

const getBlitz = () => screen.getByRole("checkbox", { name: /Blitz/ });
const clickBlitz = () => fireEvent.click(getBlitz());

const getSeize = () => screen.getByRole("checkbox", { name: /Seize the initiative/ });
const clickSeize = () => fireEvent.click(getSeize());

const getSubmit = () => screen.getByText("Initiative", { selector: "button" });
const clickSubmit = () => fireEvent.click(getSubmit());

//
// Hide
//
describe('hide button', function() {
    it("hides when toggled", async () => {
        renderInitiativeMenu();
        await clickHide();

        expect(screen.queryByRole("textbox")).toBeNull();
    });

    it("unhides when toggled again", async () => {
        renderInitiativeMenu();
        await clickHide();
        await clickShow();

        expect(getTitle()).not.toBeNull();
        expect(getSubmit()).not.toBeNull();
    });
});

//
// Submit
//
describe("roll initiative button enabled", function() {
    it("does not enable initiative roll by default", () => {
        renderInitiativeMenu();

        expect(getSubmit()).toBeDisabled();
    });

    function validateCounts(values: [base: string, dice: string, expected: boolean][]) {
        for (const [base, dice, expected] of values) {
            it(`${expected ? "en" : "dis"}ables initiative button for base=${base || '""'} dice=${dice || '""'}`, async () => {
                renderInitiativeMenu();
                await setBase(base);
                await setDice(dice);

                const expectSubmit = expect(getSubmit());
                expected ? expectSubmit.toBeEnabled() : expectSubmit.toBeDisabled();
            });
        }
    }([
        ["", "", false],
        ["-1", "", true], // Can roll low base, and dice is assumed to be 1 when unspecified
        ["0", "1", true], // Can also specify dice
        ["", "1", false], // Can't leave base unspecified
        ["1", "0", false], // Can't specify too low of dice
        ["-2", "2", true], // Base goes down to -2
        ["-3", "2", false],
        ["1", "5", true],
        ["2", "6", false], // Dice goes up to 5
        ["50", "5", true], // Maximum initiative
    ]);
});

describe("roll initiative base", function () {
    it("starts base off at empty", () => {
        renderInitiativeMenu();

        expect(getBase()).toHaveValue("");
    });
});

describe("local initiative rolls", function() {
    it("rolls with base and dice", async () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, actions, game });

        await setBase("12");
        await setDice("2");
        expect(getSubmit()).toBeEnabled();
        await clickSubmit();

        expect(actions).toHaveLength(1);
        const event: Event.Initiative = actions[0];
        expect(event.ty).toBe("newEvent");
        expect(event.event.ty).toBe("initiativeRoll");
        expect(event.event.base).toBe(12);
        expect(event.event.dice).toHaveLength(2);
    });

    it("rolls with initiative title", async() => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, actions, game });

        await setBase("8");
        await setDice("1");
        await setTitle("go last");
        expect(getSubmit()).toBeEnabled();
        await clickSubmit();

        expect(actions).toHaveLength(1);
        const event: Event.Initiative = actions[0];
        expect(event.ty).toBe("newEvent");
        expect(event.event.ty).toBe("initiativeRoll");
        expect(event.event.title).toBe("go last");
    });


    it("rolls with seize the initiative", async () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, actions, game });

        await setBase("8");
        await setDice("1");
        await clickSeize();
        expect(getSubmit()).toBeEnabled();
        await clickSubmit();

        expect(actions).toHaveLength(1);
        const event: Event.Initiative = actions[0];
        expect(event.ty).toBe("newEvent");
        expect(event.event.ty).toBe("initiativeRoll");
        expect(event.event.seized).toBe(true);
    });
});

describe("blitz", function() {
    it("rolls with blitz", async () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, actions, game });

        await setBase("8");
        await setDice("1");
        await clickBlitz();
        expect(getSubmit()).toBeEnabled();
        await clickSubmit();

        expect(actions).toHaveLength(1);
        const event: Event.Initiative = actions[0];
        expect(event.ty).toBe("newEvent");
        expect(event.event.ty).toBe("initiativeRoll");
        expect(event.event.blitzed).toBe(true);
    });

    it("disables dice when blitz is clicked", async () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, actions, game });

        await clickBlitz();
        const dice = getDice();
        expect(dice).toBeDisabled();
        expect(dice).toHaveValue("5");
    });

    it("swaps off after clicking seize", async() => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, actions, game });

        await clickBlitz();
        expect(getSeize()).toBeEnabled();
        await clickSeize();
        expect(getBlitz()).not.toBeChecked();
        expect(getSeize()).toBeChecked();
    });
});

describe("seize the initiative", function() {
    it("rolls with seized", async () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, actions, game });

        await setBase("8");
        await setDice("1");
        await clickSeize();
        expect(getSubmit()).toBeEnabled();
        await clickSubmit();

        expect(actions).toHaveLength(1);
        const event: Event.Initiative = actions[0];
        expect(event.ty).toBe("newEvent");
        expect(event.event.ty).toBe("initiativeRoll");
        expect(event.event.seized).toBe(true);
    });

    it("swaps off after clicking blitz", async() => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, actions, game });

        await clickSeize();
        expect(getBlitz()).toBeEnabled();
        await clickBlitz();
        expect(getSeize()).not.toBeChecked();
        expect(getBlitz()).toBeChecked();
    });
});
