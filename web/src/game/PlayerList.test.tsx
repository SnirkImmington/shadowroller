import * as React from 'react';
import { ThemeProvider } from 'styled-components/macro';
import { render, fireEvent, screen } from '@testing-library/react';
import * as theme from 'theme';

import * as Event from 'event';
import * as eventTests from 'event/event.test';
import * as Game from 'game';
import * as gameTests from 'game/game.test';
import * as Player from 'player';
import * as srutil from 'srutil';

import PlayerList, { PlayerName } from './PlayerList';

import * as fc from 'fast-check';
import * as fcUtils from 'fc-utils.test';

export type RenderOptions = {
    game: Game.State,
}

/** Produce a Game state with the given player names as players. */
function gameWithPlayerNames(names: string[]): Game.Game {
    const players = new Map<string, Player.Info>();
    for (const name of names) {
        const id = srutil.genRandomID();
        const info: Player.Info = {
            id, name, hue: 12, online: false
        };
        players.set(id, info);
    }
    return { gameID: "someGame", players, gms: [] };
}

/** render a player list of the players in the given game */
export function renderPlayerList(options?: RenderOptions) {
    const { game } = options ?? { game: null };
    return render(
        <ThemeProvider theme={theme.default}>
            <Game.Ctx.Provider value={game}>
                <PlayerList />
            </Game.Ctx.Provider>
        </ThemeProvider>
    );
}

/** render a single <PlayerName /> element */
export function renderPlayerName(playerName: string, isGM: boolean) {
    return render(
        <ThemeProvider theme={theme.default}>
            <PlayerName player={{ name: playerName, id: '', hue: 0 }} isGM={isGM} />
        </ThemeProvider>
    );
}

// get icon, get gm icon

describe("<PlayerName />", function() {
    it("renders a player's name", function() {
        renderPlayerName("smork", false);
        expect(screen.getByText("smork")).toBeInTheDocument();
    });

    fcUtils.property(
        "renders all player names provided",
        fcUtils.playerNames(), function(names: string[]) {
            const gameWithNames = gameWithPlayerNames(names);
            renderPlayerList({ game: gameWithNames });
            for (const name of names) {
                const expectedCount = names.filter(n => n === name).length;
                const results = screen.getAllByText(name, { exact: true, trim: false });
                expect(results.length).toBeGreaterThanOrEqual(expectedCount);
                for (const result of results) {
                    expect(result).toBeInTheDocument();
                }
            }
        }
    );
})
