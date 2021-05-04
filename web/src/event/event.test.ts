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

describe("titleOf()", function() {
    function titleOf(title: string, cases: (Event.Event|string)[]) {
        it(`${title}`, function() {
            for (let i = 0; i < cases.length; i += 2) {
                let event: Event.Event = cases[i];
                let title: string = cases[i + 1];
                let result = Event.titleOf(event);
                expect(result).toBe(title);
            }
        });
    }
    titleOf("provides default messages", [
        { ty: "roll", dice: [] }, "roll 0 dice",
        { ty: "roll", dice: [1] }, "roll 1 die",
        { ty: "roll", dice: [1, 2, 3] }, "roll 3 dice",

        { ty: "edgeRoll", rounds: [[]] }, "push the limit on 0 dice",
        { ty: "edgeRoll", rounds: [[1], []] }, "push the limit on 1 die",
        { ty: "edgeRoll", rounds: [[1, 2, 3], []] }, "push the limit on 3 dice",
    ]);

    titleOf("follows the titles of titled events", [
        { title: "Hello", ty: "roll" }, "Hello",
        { title: "Hello", ty: "edgeRoll" }, "Hello",
        { title: "Hello", ty: "rerollFailures" }, "Hello",
        { title: "Hello", ty: "initiativeRoll" }, "Hello",
    ]);

});
