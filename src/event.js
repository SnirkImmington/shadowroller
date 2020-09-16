// @flow

import * as React from 'react';
import * as srutil from 'srutil';

export type GameSource = {| +id: string, +name: string |};
export type Source =
| "local"
| GameSource

export type Roll = {|
    +ty: "roll",
    +id: number,
    +source: Source,
    +title: string,
    +dice: number[],
|};

export type EdgeRoll = {|
    +ty: "edgeRoll",
    +id: number,
    +source: Source,
    +title: string,
    +rounds: number[][],
|};

export type RerollFailures = {|
    +ty: "rerollFailures",
    +id: number,
    +source: Source,
    +rollID: number,
    +title: string,
    +rounds: number[][],
|}

export type PlayerJoin = {|
    +ty: "playerJoin",
    +id: number,
    source: GameSource,
|};

export type Event =
| Roll
| EdgeRoll
| RerollFailures
| PlayerJoin
;

export type DiceEvent = Roll | EdgeRoll | RerollFailures;

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
    return event.id || 0;
}

export function colorOf(event: Event): string {
    return event.source !== "local" ? srutil.hashedColor(event.source.id) : 'slategray';
}

export function canModify(event: Event, playerID: ?string): bool {
    return event.source === "local" || (playerID != null && event.source.id === playerID);
}

export function wouldScroll(event: DiceEvent): bool {
    return (event?.dice && event.dice.length >= 12)
    // flow-ignore-all-next-line this check works fine
        || (event?.rounds && event.rounds.flatMap(r => r).length >= 10);
}

export function newID(): number {
    return Date.now().valueOf();
}

export type Dispatch = (Action) => void;
export type Reducer = (State, Action) => State;

// Assuming that the state's events and the new events are both sorted, combine
// the new events into the old events.
function appendEventsReduce(state: State, newEvents: Event[]): State {
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

        /*if (!oldEvent.id) {
            oldEvent.id = newID();
        }
        if (!newEvent.id) {
            newEvent.id = newID();
        }*/

        // Same events: prefer the new one as it comes from server.
        if (newEvent.id && oldEvent.id && newEvent.id === oldEvent.id) {
            events.push(newEvent);
            newIx++;
            oldIx++;
        }
        // Events are sorted by [timestamp] IDs.
        else if (newEvent.id  > oldEvent.id) {
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
            if (!action.event.id) {
                if (process.env.NODE_ENV !== "production") {
                    console.log("Reducer assigning ID to ", action.event);
                }
                // flow-ignore-all-next-line
                action.event.id = newID();
            }
            return { ...state, events: [action.event, ...state.events] };
        case "mergeEvents":
            return appendEventsReduce(state, action.events);
        case "clearEvents":
            const localEvents = state.events.filter(e => e?.source === "local");
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
export const DispatchCtx = React.createContext<Dispatch>(() => {});
