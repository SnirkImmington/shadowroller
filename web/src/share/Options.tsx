import * as React from 'react';
import * as UI from 'style';
import styled from 'styled-components/macro';

import * as Share from 'share';
import * as Game from 'game';

import * as srUtil from 'srutil';

type Props = {
    prefix: string,
    state: Share.Mode,
    gmsDisabled?: boolean,
    onChange: (share: Share.Mode) => void
};

const StyledRow = styled(UI.FlexRow).attrs(
    { flexWrap: true }
)`
    & > * {
        width: auto;
        margin-bottom: 0.25rem;
        margin-bottom: 0;
        margin-right: 1.25rem;
    }
    & > *:last-child {
        margin-bottom: 0;
        margin-right: inherit;
    }
`;

export default function PublicityOptions({ prefix, state, gmsDisabled, onChange }: Props) {
    const game = React.useContext(Game.Ctx);
    const gms = game?.gms?.length ?? 0;
    const handleChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            switch (e.target.value) {
                case "in-game":
                    onChange(Share.Mode.InGame);
                    return;
                case "gms":
                    onChange(Share.Mode.GMs);
                    return;
                case "private":
                    onChange(Share.Mode.Private);
                    return;
                default:
                    if (process.env.NODE_ENV !== "production") {
                        console.log("ShareOptions received unknown select:", e);
                    }
            }
        },
    [onChange]);

    return ( // TODO formgroup or similar
        <StyledRow>
            Roll &nbsp;
            <UI.RadioLink id={`${prefix}-set-in-game`} name={`${prefix}-location`}
                          type="radio" light value="in-game"
                          checked={state === Share.Mode.InGame} onChange={handleChange}>
                in game
            </UI.RadioLink>
            <UI.RadioLink id={`${prefix}-set-to-gm`} name={`${prefix}-location`}
                          type="radio" light disabled={gmsDisabled} value="gms"
                          checked={state === Share.Mode.GMs} onChange={handleChange}>
                to {srUtil.pluralize(gms, "GM")}
            </UI.RadioLink>
            <UI.RadioLink id={`${prefix}-set-private`} name={`${prefix}-location`}
                          type="radio" light value="private"
                          checked={state === Share.Mode.Private}
                          onChange={handleChange}>
                not shared
            </UI.RadioLink>
        </StyledRow>
    );
}
