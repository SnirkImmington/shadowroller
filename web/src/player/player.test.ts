import * as Player from '.';

/** mockDispatch produces a mocked Dispatch function and the actions that were dispatched. */
export function mockDispatch(): [Player.Dispatch, Player.Action[]] {
    let actions: Player.Action[] = [];
    return [jest.fn((action: Player.Action) => { actions.push(action); }), actions];
}


export function mockState(): Player.Player {
    return {
        id: "someplayer",
        name: "The Player",
        hue: 12,
        online: true,

        username: "player32",
        onlineMode: Player.OnlineModeOnline,
    };
}

describe("reduce()", function() {
    it("handles a join", function() {
        const initial = null;
        const joined = mockState();
        const action: Player.Action = { ty: "join", self: joined };
        const result = Player.reduce(initial, action);
        expect(result).toEqual(joined);
    });
    it("handles a leave", function() {
        const initial = mockState();
        const action: Player.Action = { ty: "leave" };
        const result = Player.reduce(initial, action);
        expect(result).toBeFalsy();
    });
    it("handles an update", function() {
        const initial = mockState();
        const action: Player.Action = { ty: "update", diff: { username: "player12" } };
        const result = Player.reduce(initial, action);
        expect(result!.username).toBe("player12");
    });
});
