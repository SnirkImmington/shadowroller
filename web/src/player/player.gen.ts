import * as fc from 'fast-check';
import * as Player from '.';

export function hue(): fc.Arbitrary<number> {
    return fc.integer({ min: 0, max: 256 });
}

export function onlineMode(): fc.Arbitrary<Player.OnlineMode> {
    return fc.integer({ min: 1, max: 3}).map(i => {
        switch (i) {
            case 1: return Player.OnlineModeAuto;
            case 2: return Player.OnlineModeOnline;
            case 3: return Player.OnlineModeOffline;
            default: throw Error("Bad filter");
        }
    })
}

export function info(): fc.Arbitrary<Player.Info> {
    return fc.record({
        id: fc.string(),
        name: fc.string(),
        hue: hue(),
        online: fc.boolean()
    });
}

export function player(): fc.Arbitrary<Player.Player> {
    return fc.record({ // There's probably a way to map this but I haven't figured it out
        id: fc.string(),
        name: fc.string(),
        hue: hue(),
        username: fc.string(),
        onlineMode: onlineMode()
    });
}
