// @flow

import * as React from 'react';
import type { StyledComponent } from 'styled-components';
import styled from 'styled-components/macro';
import { Button } from 'style';

import * as Game from 'game';

const SRHeader: StyledComponent<> = styled.header`
    background-color: #222;
    height: 4em;
    padding: 0.9em;
    color: white;
    margin-bottom: 1em;
    display: flex;
    align-items: center;
`;

const SRTitle = styled.h1`
    font-size: 2em;
    font-style: oblique;
    font-weight: 900;
    margin-top: 5px;

    margin-left: .5em;
    @media all and (min-width: 768px) {
        margin-left: 4em;
    }
`;

const JoinButton = styled(Button)`
    color: white;
    background: #222;
    border: 3px solid white;

    color: ${props => props.expanded ? '#222' : 'white'};
    background: ${props =>props.expanded ? 'white' : '#222'};
    border: 3px solid ${props=>props.expanded ? '#222' : 'white'};

    margin-left: auto;

    margin-right: 1em;
    @media all and (min-width: 768px) {
        margin-right: 6em;
    }

    /*
    &:hover {
        background: white;
        color: #222;
        border: 3px solid white;
    }

    &:active {
        color: white;
        background: #222;
        border: 3px solid white;
    }*/
`;

export type Props = {
    +game: Game.State,
    +expanded: bool,
    +onClick: () => any,
}

export default function Header({ game, expanded, onClick }: Props) {
    function handleJoinClick(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
        onClick();
    }

    let message;
    if (game) {
        if (game.connected) {
            message = <tt>{game.gameID}</tt>;
        }
        else {
            message = "Disconnected";
        }
    }
    else if (expanded) {
        message = "Cancel";
    }
    else {
        message = "Join";
    }

    return (
        <SRHeader>
            <SRTitle>Shadowroller</SRTitle>
            <JoinButton expanded={expanded} onClick={handleJoinClick}>
                {message}
            </JoinButton>
        </SRHeader>
    );
}
