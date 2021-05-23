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

    it("handles a player create", function() {
        const action: Game.Action = {
            ty: "newPlayer",
            player: {
                id: "newPlayerID",
                name: "New player",
                hue: 22,
                online: true
            }
        };
        const state = mockState();
        const result = Game.reduce(state, action);
        const newPlayer = result.players.get("newPlayerID");
        expect(newPlayer).toEqual(action.player);
    });

    it("handles a player delete", function() {
        const action: Game.Action = {
            ty: "deletePlayer",
            id: "player1ID",
        };
        const state = mockState();
        const result = Game.reduce(state, action);
        const newPlayer = result.players.get("player1ID");
        expect(newPlayer).toBeFalsy();
    });

    it("handles a player update", function() {
        const action: Game.Action = {
            ty: "updatePlayer",
            id: "player1ID",
            diff: {
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

    it("handles a set players", function() {
        const newPlayers = new Map<string, Game.PlayerInfo>();
        newPlayers.set("player4ID", {
            id: "player4ID",
            name: "player 4",
            hue: 2,
            online: false,
        });
        const action: Game.Action = {
            ty: "setPlayers",
            players: newPlayers
        };
        const state = mockState();
        const result = Game.reduce(state, action);
        expect(result).not.toBeNull();
        const player1 = result.players.get("player1ID");
        expect(player1).toBeFalsy();
        const player4 = result.players.get("player4ID");
        expect(player4.name).toBe("player 4");
    });

    it("ignores an invalid action", function() {
        const action = "This definitely isn't an action.";
        const state = mockState();
        const result = Game.reduce(state, action);
        expect(result).toBe(state);
    })
});
