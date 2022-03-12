import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import * as srutil from 'srutil';
import * as layout from 'layout';

import * as Game from 'game';
import * as Event from 'event';
import * as Player from 'player';
import * as server from 'server';
import * as stream from 'sseStream';
import * as routes from 'routes';
import { SetConnectionCtx } from 'connection';

import SRHeader from 'header/SRHeader';
import PlayerEditMenu from 'player/EditMenu';
import GameJoinMenu from 'game/JoinMenu';
import RollDiceMenu from 'DiceRollMenu';
import RollInitiativeMenu from 'InitiativeRollMenu';
import EventHistory from 'history/HistoryDisplay';

import EditMenu from 'roll/EditMenu';
import InitEditMenu from 'initiative/EditMenu';

const AppGrid = styled.div(({ theme }) => ({
    height: "100%",
    display: "grid",
    color: theme.colors.text,
    backgroundColor: theme.colors.background,

    gridTemplateColumns: `minmax(0, 1fr) minmax(0, ${layout.MENU_MAX}rem) minmax(0, 1fr)`, // was 55 rem
    gridTemplateRows: "auto auto minmax(auto, 100%)", // header, left, right

    [layout.Media.Columns]: {
        gridTemplateColumns: `minmax(0, 1fr) minmax(${layout.MENU_MIN}rem, ${layout.MENU_MAX}rem) minmax(${layout.ROLLS_SMALL}rem, ${layout.ROLLS_WIDE}rem) minmax(0, 1fr)`,
        gridTemplateRows: "auto 100%"
    },
    [layout.Media.ColumnsMax]: { // Big enough for gaps
        gridTemplateColumns: "0 8fr 7fr 0"
    }
}));

const AppLeft = styled(UI.FlexColumn)({
    gridColumn: 2,

    "& > *": {
        marginBottom: "0.75rem",
    },

    margin: `0 ${layout.Space.Small} 0 ${layout.Space.Small}`,
    [layout.Media.Columns]: {
        "& > *:not(last-child)": {
            marginBottom: "1.25rem",
        },
        margin: `0 ${layout.Space.Med} 0 ${layout.Space.Med}`,
    }
});

const AppRight = styled(UI.FlexColumn)({
    gridColumn: 2,
    [layout.Media.Columns]: {
        gridColumn: 3
    }
});

export default function Shadowroller() {
    const game = React.useContext(Game.Ctx);
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const playerDispatch = React.useContext(Player.DispatchCtx);
    const setConnection = React.useContext(SetConnectionCtx);
    const [connect] = React.useContext(stream.Ctx);

    const [menuShown, toggleMenuShown] = srutil.useToggle(false);

    // On first load, read credentials from localStorage and log in.
    React.useEffect(() => {
        server.loadCredentials();
        if (server.session) {
            routes.auth.reauth({ session: server.session })
                .onConnection(setConnection)
                .onResponse(response => {
                    server.handleLogin({
                        persist: true, response,
                        setConnection, connect,
                        gameDispatch,
                        playerDispatch,
                        eventDispatch
                    });
                })
                .onClientError((resp: any) => {
                    if (process.env.NODE_ENV !== "production") {
                        console.log("Got client error for reauth: ", resp);
                    }
                    server.clearSession();
                    setConnection("offline");
                });
            setConnection("disconnected");
        }
        // We want this to only run on startup.
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <AppGrid>
            <SRHeader onClick={toggleMenuShown} />
            <AppLeft>
                {menuShown &&
                    (game ?
                      <PlayerEditMenu hide={toggleMenuShown} />
                    : <GameJoinMenu hide={toggleMenuShown} />)
                }
                <RollDiceMenu />
                <RollInitiativeMenu />
            </AppLeft>
            <AppRight>
                <EditMenu editing={true} loading={false} setLoading={() => {}} event={{ ty: "roll", dice: [1,2,3,4], id: 0, source: "local", title:"foo", glitchy: 0 }} onEdit={console.log} onSubmit={console.log} color="lightgreen" id="editing-roll" />
                <InitEditMenu editing={true} loading={false} setLoading={() => {}} event={{ ty: "initiativeRoll", base: 12, dice: [1, 2, 3], id: 0, source: "local", title: "foo", blitzed: false, seized: false }} id="editing-initiative" color="darkgreen" onEdit={console.log} onSubmit={console.log} />
                <EventHistory />
            </AppRight>
        </AppGrid>
    );
}
