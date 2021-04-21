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

// Things to test
// - join
// - leave
// - playerUpdate
// - setPlayers
// - default

describe("reduce()", function() {
    it("handles joining a new game", function() {
        const action: Game.Action = {
            ty: "join", gameID: "foo", players: new Map()
        };
        const state = null;
        const result = game.reduce(state, action);
        expect(result).not.toBeNull();
        expect(result.gameID).toBe("foo");
    });

    it("handles joining an existing game", function() {
        const action: Game.Action = {
            ty: "join", gameID: "bar", players: new Map()
        };
        const state: Game.State = {
            gameID: "foo",
            players: new Map()
        };
        const result = game.reduce(state, action);
        expect(result).not.toBeNull();
        expect(result.gameID).toBe("bar");
    });
});
