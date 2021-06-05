import * as Event from '.';

/** mockDispatch produces a mocked Dispatch function and the actions that were dispatched. */
export function mockDispatch(): [Event.Dispatch, Event.Action[]] {
    let actions: Event.Action[] = [];
    return [jest.fn((action: Event.Action) => { actions.push(action); }), actions];
}

// Things to test:
// - titleOf()
// - appendEventsReduce
//   + newEvent, mergeEvents
// - clearEvents
// - deleteEvent
// - modifyRoll
// - seizeInitiative
// - reroll

const rollBase = {
    id: 0, edit: 0, source: "local" as Event.Source, title: "", glitchy: 0,
}

describe("titleOf()", function() {
    function titleOf(title: string, cases: (Event.Event|string)[]) {
        it(`${title}`, function() {
            for (let i = 0; i < cases.length; i += 2) {
                let event = cases[i] as Event.Event;
                let title = cases[i + 1] as string;
                let result = Event.titleOf(event);
                expect(result).toBe(title);
            }
        });
    }
    titleOf("provides default messages", [
        { ty: "roll", dice: [], ...rollBase }, "roll 0 dice",
        { ty: "roll", dice: [1], ...rollBase }, "roll 1 die",
        { ty: "roll", dice: [1, 2, 3], ...rollBase }, "roll 3 dice",

        { ty: "edgeRoll", rounds: [[]], ...rollBase }, "push the limit on 0 dice",
        { ty: "edgeRoll", rounds: [[1], []], ...rollBase }, "push the limit on 1 die",
        { ty: "edgeRoll", rounds: [[1, 2, 3], []], ...rollBase }, "push the limit on 3 dice",
    ]);

    titleOf("follows the titles of titled events", [
        { ...rollBase, title: "Hello", dice: [], ty: "roll" }, "Hello",
        { ...rollBase, title: "Hello", rounds: [[]], ty: "edgeRoll" }, "Hello",
        { ...rollBase, title: "Hello", rounds: [[]], rollID: 0, ty: "rerollFailures" }, "Hello",
        { ...rollBase, title: "Hello", base: 0, dice: [], seized: false, blitzed: false, ty: "initiativeRoll" }, "Hello",
    ]);

});
