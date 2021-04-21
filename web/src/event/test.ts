import * as Event from './event';

/** mockDispatch produces a mocked Dispatch function and the actions that were dispatched. */
export function mockDispatch(): [Event.Dispatch, Event.Action[]] {
    let actions: Event.Action[] = [];
    return [jest.fn((action: Event.Action) => { actions.push(action); }), actions];
}

// Things to test:
// - titleOf
// - appendEventsReduce
//   + newEvent, mergeEvents
// - clearEvents
// - deleteEvent
// - modifyRoll
// - seizeInitiative
// - reroll
