import * as Game from '.';

/** mockDispatch produces a mocked Dispatch function and the actions that were dispatched. */
export function mockDispatch(): [Game.Dispatch, Game.Action[]] {
    let actions: Game.Action[] = [];
    return [jest.fn((action: Game.Action) => { actions.push(action); }), actions];
}

/** mockState produces a game "someGame" with two players. */
export function mockState(): Game.Game {
    let players = new Map<string, Game.PlayerInfo>();
    players.set("player1ID", {
        id: "player1ID",
        name: "player1Name",
        hue: 1,
        online: false
    });
    players.set("player2ID", {
        id: "player2ID",
        name: "player2Name",
        hue: 2,
        online: true
    });
    return {
        gameID: "someGame",
        players
    };
}

describe("reduce()", function() {
    it("handles joining a new game", function() {
        const action: Game.Action = {
            ty: "join", gameID: "foo", players: new Map()
        };
        const state = null;
        const result = Game.reduce(state, action);
        expect(result).not.toBeNull();
        expect(result.gameID).toBe("foo");
    });

    it("handles joining an existing game", function() {
        const action: Game.Action = {
            ty: "join", gameID: "bar", players: new Map()
        };
        const state = mockState();
        const result = Game.reduce(state, action);
        expect(result).not.toBeNull();
        expect(result.gameID).toBe("bar");
    });

    it("handles leaving an existing game", function() {
        const action: Game.Action = {
            ty: "leave",
        };
        const state: Game.State = {
            gameID: "foo",
            players: new Map()
        };
        const result = Game.reduce(state, action);
        expect(result).toBeNull();
    });

    it("handles a player update", function() {
        const action: Game.Action = {
            ty: "playerUpdate",
            id: "player1ID",
            update: {
                name: "not player 1 name",
                hue: 3
            }
        };
        const state = mockState();
        const result = Game.reduce(state, action);
        expect(result).not.toBeNull();
        const player1 = result.players.get("player1ID");
        expect(player1).not.toBeNull();
        expect(player1.name).toBe("not player 1 name");
        expect(player1.hue).toBe(3);
        expect(player1.online).toBe(false);
    });

    it("creates new player for a player update", function() {
        const action: Game.Action = {
            ty: "playerUpdate",
            id: "newPlayerID",
            update: {
                name: "New player",
                hue: 22,
                online: true
            }
        };
        const state = mockState();
        const result = Game.reduce(state, action);
        const newPlayer = result.players.get("newPlayerID");
        expect(newPlayer).toEqual(action.update);
    });

    it("ignores an invalid action", function() {
        const action = "This definitely isn't an action.";
        const state = mockState();
        const result = Game.reduce(state, action);
        expect(result).toBe(state);
    })
});
