// @flow

import * as React from 'react';
import * as Game from 'game';

export type LocalRoll = {|
    +ty: "localRoll",
    +ts: number,
    +dice: number[],
    +title: string,
|};

export type GameRoll = {|
    +ty: "gameRoll",
    +id: string,
    +playerID: string,
    +playerName: string,
    +title: string,
    +dice: number[],
|};

export type PlayerJoin = {|
    +ty: "playerJoin",
    +id: string,
    +player: Game.Player,
|};

export type ServerEvent =
| GameRoll
| PlayerJoin
;

export type Event =
| LocalRoll
| GameRoll
| PlayerJoin
;

export type HistoryFetchState = "ready" | "fetching" | "finished";

export type Action =
| {| +ty: "setHistoryFetch", state: HistoryFetchState |}
| {| +ty: "newEvent", event: Event |}
| {| +ty: "mergeEvents", events: Event[] |}
| {| +ty: "clearEvents" |}
;

/*

Here, time is pushing events to the top of the stack.

- (posted-1) <- gonna go through {ty: newEvent}
- posted-0
- (missed-1) // Events which happened while we lost connection to /events
- (missed-0) // (retrieval unimplemented!)

- local-0 <- events[0], <-lastLocalID                   // FIRST IN events[]
- (missed-dc-0)
- history-0 <- newestIdSeen
- history-1 // Events which happened before we connected
- history-2
- history-3
- local-3.5
- history-4 <- oldestIDSeen
- local-4.5 <- events[events.length - 1] // LAST IN events[]

- (history-6) <- would go through {ty: retrieveHistory}
- (history-6) // Events on server

Ways we can miss an event:
- We DC/error from the `/events` listener; events are pushed to the stack we missed
  + when reconnecting to /events, check for events NEWER than our last seen and
    weave them into the event list, making sure to stop once event IDs line up.
    We should just trust the client and server's clocks.
  + we may continue receiving events on top while trying to retrieve events from
    a DC, but we shouldn't update newestIDSeen until we know we've retrieved all events.
- When we join, there are _always_ prior game events that we do not know about.
  The oldest/newest event we know about is the one of us joining. We need to
  query the server for events older than the one seen

Invariants:
- once historyRetrieval === "finished", we only miss events by losing connection
  to the eventstream. Then, we miss out on events that are _newer_ than newestIDseen,
  up until
*/

export type State = {|
    +events: Event[],
    +historyFetch: HistoryFetchState,
|};
export const defaultState: State = {
    events: [],
    historyFetch: "ready",
};

function compareValue(event: Event): number {
    if (event.id) {
        // If we have server events with different offsets, they should be
        // sequential in the initial lists anyway. This means that local events
        // in the same milisecond come before all server events in that
        // milisecond, but this should be stable for server events.
        return event.id.split("-", 2).map(t => parseInt(t)).reduce((l, r) => l + r);
    }
    else if (event.ts) {
        return event.ts;
    }
    else { // Events always have an id or ts anyway
        return 0;
    }
}

export type Dispatch = (Action) => void;
export type Reducer = (State, Action) => State;

// Assuming that the state's events and the new events are both sorted, combine
// the new events into the old events.
function appendEventsReduce(state: State, newEvents: Event[]): State {
    console.log("Reducing", state.events, "with", newEvents);
    const oldEvents = state.events;
    const events = [];

    let oldIx = 0, newIx = 0;
    while (true) {
        if (oldIx >= oldEvents.length) {
            events.push(...newEvents.slice(newIx));
            break;
        }
        if (newIx >= newEvents.length) {
            events.push(...oldEvents.slice(oldIx));
            break;
        }
        const oldEvent = oldEvents[oldIx];
        const newEvent = newEvents[newIx];

        // Same events: prefer the new one as it comes from server.
        if (newEvent.id && oldEvent.id && newEvent.id === oldEvent.id) {
            events.push(newEvent);
            newIx++;
            oldIx++;
        }
        // uh, comparing arrays is totally fine, don't worry about it
        // LARGER event ids are on the TOP
        // flow-ignore-all-next-line
        else if (compareValue(newEvent) > compareValue(oldEvent)) {
            events.push(newEvent);
            newIx++;
        }
        else {
            events.push(oldEvent);
            oldIx++;
        }
    }

    return {
        ...state,
        events: events
    };
}


function eventReduce(state: State, action: Action): State {
    switch (action.ty) {
        case "setHistoryFetch":
            return { ...state, historyFetch: action.state };
        case "newEvent":
            return { ...state, events: [action.event, ...state.events] };
        case "mergeEvents":
            return appendEventsReduce(state, action.events);
        case "clearEvents":
            const localEvents = state.events.filter(e => e.ts ? true : false);
            return { ...state, events: localEvents };
        default:
            (action: empty); // eslint-disable-line no-unused-expressions
            if (process.env.NODE_ENV !== "production") {
                console.error("Events received invalid action", action);
            }
            return state;
    }
}

let reduce: Reducer;
if (process.env.NODE_ENV !== "production") {
    reduce = function(state: State, action: Action): State {
        const result = eventReduce(state, action);
        console.log("Events", action.ty, state, action, result);
        return result;
    }
}
else {
    reduce = eventReduce;
}

export { reduce };
export const Ctx = React.createContext<State>(defaultState);
export const DispatchCtx = React.createContext<Dispatch>(null);
