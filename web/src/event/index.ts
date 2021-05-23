import * as React from 'react';

import * as Share from 'share';

export type GameSource = { id: string, name: string, share: Share.Mode };
export type Source =
| "local"
| GameSource

export type Roll = {
    ty: "roll",
    id: number,
    edit?: number,
    source: Source,
    title: string,
    dice: number[],
    glitchy: number,
};

export type EdgeRoll = {
    ty: "edgeRoll",
    id: number,
    edit?: number,
    source: Source,
    title: string,
    rounds: number[][],
    glitchy: number,
};

export type RerollFailures = {
    ty: "rerollFailures",
    id: number,
    edit?: number,
    source: Source,
    rollID: number,
    title: string,
    rounds: number[][],
    glitchy: number,
}

export type Initiative = {
    ty: "initiativeRoll",
    id: number,
    edit?: number,
    source: Source,
    title: string,
    base: number,
    dice: number[],
    seized: boolean,
    blitzed: boolean,
};

export type PlayerJoin = {
    ty: "playerJoin",
    id: number,
    source: GameSource,
};

export type Event =
| Roll
| EdgeRoll
| RerollFailures
| Initiative
| PlayerJoin
;

export type DiceEvent = Roll | EdgeRoll | RerollFailures;

export type HistoryFetchState = "ready" | "fetching" | "finished";

export type Action =
| { ty: "setHistoryFetch", state: HistoryFetchState }
| { ty: "newEvent", event: Event }
| { ty: "mergeEvents", events: Event[] }
| { ty: "clearEvents" }

| { ty: "selectEdit", event: DiceEvent }
| { ty: "clearEdit" }

| { ty: "modifyEvent", id: number, edit: number, diff: Partial<Event> }
| { ty: "modifyShare", id: number, edit: number, share: Share.Mode }
| { ty: "deleteEvent", id: number }

| { ty: "seizeInitiative", id: number, edit: number }
| { ty: "reroll", id: number, edit: number, reroll: number[] }
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

export type State = {
    events: Event[],
    historyFetch: HistoryFetchState,
    editing: DiceEvent | null,
};
export const defaultState: State = {
    events: [],
    historyFetch: "ready",
    editing: null,
};

export function timeOf(event: Event): Date {
    return new Date(event.id);
}

export function canModify(event: Event, playerID: string|null): boolean {
    return event.source === "local" || (playerID != null && event.source.id === playerID);
}

export function titleOf(event: Event): string {
    switch (event.ty) {
        case "roll":
            return event.title || `roll ${event.dice.length} ${event.dice.length === 1 ? "die" : "dice"}`;
        case "edgeRoll":
            return event.title || `push the limit on ${event.rounds[0].length} ${event.rounds[0].length === 1 ? "die" : "dice"}`;
        case "rerollFailures":
            return event.title || `reroll failures on ${event.rounds[1].length} ${event.rounds[1].length === 1 ? "die" : "dice"}`;
        case "initiativeRoll":
            return event.title || "initiative";
        case "playerJoin":
            return `${event.source.name} joined`;
        default:
            if (process.env.NODE_ENV !== "production") {
                const event_: never = event;
                console.error("Called titleOf with unknown event", event_)
            }
            return "event";
    }
}

export function wouldScroll(event: DiceEvent): boolean {
    return ("dice" in event && event.dice.length > 12)
        || ("rounds" in event && event.rounds.flatMap(r => r).length > 10);
}

export function newID(): number {
    return Date.now().valueOf();
}

export type Dispatch = (action: Action) => void;
export type Reducer = (state: State, action: Action) => State;

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
                action.event.id = newID();
            }
            return appendEventsReduce(state, [action.event]);
        case "mergeEvents":
            return appendEventsReduce(state, action.events);
        case "clearEvents":
            const localEvents = state.events.filter(e => e?.source === "local");
            return { ...state, events: localEvents };

        case "deleteEvent":
            const deletedEvents = state.events.filter(e => e.id !== action.id);
            return { ...state, events: deletedEvents };
        case "modifyEvent":
            const newEventsWithModified = state.events.map(e =>
                // Server dispatches this for initiative seized changes
                e.id === action.id && e.ty !== "playerJoin" ?
                    { ...e, edit: action.edit, ...action.diff }
                    : e
            ) as Event[];
            return { ...state, events: newEventsWithModified };
        case "modifyShare":
            const newEventsWithShare = state.events.map(e =>
                e.id === action.id && e.source !== "local" ?
                { ...e, source: { ...e.source, share: action.share } }
                : e
            );
            return { ...state, events: newEventsWithShare };
        case "seizeInitiative":
            const newEventsWithInitiative: Event[] = state.events.map(e =>
                e.id === action.id && e.ty === "initiativeRoll" ?
                    { ...e, edit: action.edit, seized: true }
                    : e
            );
            return { ...state, events: newEventsWithInitiative };
        case "reroll":
            const eventsWithReroll = state.events.map(e => {
                if (e.id === action.id && e.ty === "roll") {
                    const result: RerollFailures = {
                        id: e.id, source: e.source,
                        ty: "rerollFailures",
                        rollID: e.id,
                        title: e.title, glitchy: e.glitchy,
                        rounds: [action.reroll, e.dice]
                    };
                    return result;
                }
                else {
                    return e;
                }
            });
            return { ...state, events: eventsWithReroll };

        case "selectEdit":
            return { ...state, editing: action.event };
        case "clearEdit":
            return { ...state, editing: null };
        default:
            if (process.env.NODE_ENV !== "production") {
                const action_: never = action;
                console.error("Events received invalid action", action_);
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
