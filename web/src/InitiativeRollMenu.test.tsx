import { ThemeProvider } from 'styled-components/macro';
import * as theme from 'theme';
import { render, fireEvent, screen } from '@testing-library/react';

import * as Event from 'event';
import * as eventTests from 'event/event.test';
import * as Game from 'game';
//import * as gameTests from 'game/game.test';

import InitiativeRollMenu from './InitiativeRollMenu';

export type RenderOptions = {
    game: Game.State,
    dispatch: Event.Dispatch,
}
export function renderInitiativeMenu(options?: RenderOptions) {
    const { game, dispatch } = options ?? { game: null, dispatch: () => {} };
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

const getTitle = () => screen.getByRole("textbox", { name: "for" });
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
    it("hides when toggled", () => {
        renderInitiativeMenu();
        clickHide();

        expect(screen.queryByRole("textbox")).toBeNull();
    });

    it("unhides when toggled again", () => {
        renderInitiativeMenu();
        clickHide();
        clickShow();

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
            it(`${expected ? "en" : "dis"}ables initiative button for base=${base || '""'} dice=${dice || '""'}`, () => {
                renderInitiativeMenu();
                setBase(base);
                setDice(dice);

                const expectSubmit = expect(getSubmit());
                expected ? expectSubmit.toBeEnabled() : expectSubmit.toBeDisabled();
            });
        }
    }
    validateCounts([
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
    it("rolls with base and dice", () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, game });

        setBase("12");
        setDice("2");
        expect(getSubmit()).toBeEnabled();
        clickSubmit();

        expect(actions).toHaveLength(1);
        const action: any = actions[0];
        expect(action.ty).toBe("newEvent");
        expect(action?.event.ty).toBe("initiativeRoll");
        expect(action?.event!.base).toBe(12);
        expect(action?.event!.dice).toHaveLength(2);
    });

    it("rolls with initiative title", async() => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, game });

        setBase("8");
        setDice("1");
        setTitle("go last");
        expect(getSubmit()).toBeEnabled();
        clickSubmit();

        expect(actions).toHaveLength(1);
        const action: any = actions[0];
        expect(action.ty).toBe("newEvent");
        expect(action.event.ty).toBe("initiativeRoll");
        expect(action.event.title).toBe("go last");
    });


    it("rolls with seize the initiative", () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, game });

        setBase("8");
        setDice("1");
        clickSeize();
        expect(getSubmit()).toBeEnabled();
        clickSubmit();

        expect(actions).toHaveLength(1);
        const action: any = actions[0];
        expect(action.ty).toBe("newEvent");
        expect(action.event.ty).toBe("initiativeRoll");
        expect(action.event.seized).toBe(true);
    });
});

describe("blitz", function() {
    it("rolls with blitz", () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, game });

        setBase("8");
        setDice("1");
        clickBlitz();
        expect(getSubmit()).toBeEnabled();
        clickSubmit();

        expect(actions).toHaveLength(1);
        const action: any = actions[0];
        expect(action.ty).toBe("newEvent");
        expect(action.event.ty).toBe("initiativeRoll");
        expect(action.event.blitzed).toBe(true);
    });

    it("disables dice when blitz is clicked", () => {
        const [dispatch, _] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, game });

        clickBlitz();
        const dice = getDice();
        expect(dice).toBeDisabled();
        expect(dice).toHaveValue("5");
    });

    it("swaps off after clicking seize", async() => {
        const [dispatch, _] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, game });

        clickBlitz();
        expect(getSeize()).toBeEnabled();
        clickSeize();
        expect(getBlitz()).not.toBeChecked();
        expect(getSeize()).toBeChecked();
    });
});

describe("seize the initiative", function() {
    it("rolls with seized", () => {
        const [dispatch, actions] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, game });

        setBase("8");
        setDice("1");
        clickSeize();
        expect(getSubmit()).toBeEnabled();
        clickSubmit();

        expect(actions).toHaveLength(1);
        const action: any = actions[0];
        expect(action.ty).toBe("newEvent");
        expect(action.event.ty).toBe("initiativeRoll");
        expect(action.event.seized).toBe(true);
    });

    it("swaps off after clicking blitz", async() => {
        const [dispatch, _] = eventTests.mockDispatch();
        const game: Game.State = null;
        renderInitiativeMenu({ dispatch, game });

        clickSeize();
        expect(getBlitz()).toBeEnabled();
        clickBlitz();
        expect(getSeize()).not.toBeChecked();
        expect(getBlitz()).toBeChecked();
    });
});
