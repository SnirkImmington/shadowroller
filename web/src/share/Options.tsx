import * as React from 'react';
import * as UI from 'style';
import styled from 'styled-components/macro';

import * as Share from 'share';

type Props = {
    prefix: string
    state: Share.Mode
    onChange: (share: Share.Mode) => void
};

const StyledRow = styled(UI.ColumnToRow)`
    & > * {
        margin-bottom: 0.25em;
        @media all and (min-width: 768px) {
            margin-bottom: 0;
            margin-right: 1.25em;
        }
    }
    & > *:last-child {
        margin-bottom: 0;
        margin-right: inherit;
    }
`;

export default function PublicityOptions({ prefix, state, onChange }: Props) {
    const handleChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            switch (e.target.value) {
                case "in-game":
                    onChange(Share.InGame);
                    return;
                case "private":
                    onChange(Share.Private);
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
            <UI.RadioLink id={`${prefix}-set-in-game`} name={`${prefix}-location`}
                          type="radio" light value="in-game"
                          checked={state === Share.InGame} onChange={handleChange}>
                in game
            </UI.RadioLink>
            <UI.RadioLink id={`${prefix}-set-to-gm`} name={`${prefix}-location`}
                          type="radio" light disabled value=""
                          checked={false} onChange={function() {}}>
                to GM
            </UI.RadioLink>
            <UI.RadioLink id={`${prefix}-set-private`} name={`${prefix}-location`}
                          type="radio" light value="private"
                          checked={state === Share.Private}
                          onChange={handleChange}>
                just me
            </UI.RadioLink>
        </StyledRow>
    );
}
