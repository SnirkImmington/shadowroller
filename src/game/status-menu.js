// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as Game from 'game';

import * as server from 'server';
import * as srutil from 'srutil';

type Props = {
    game: Game.State,
    dispatch: Game.Dispatch,
    setConnection: server.SetConnection
};
export function StatusMenu({ game, dispatch, setConnection}: Props) {
    if (!game) {
        return 'Something messed up, please press the join button again';
    }
    return (
        `Connected to ${game.gameID} as ${game.player.name}.`
    );
}
