import * as UI from 'style';
import styled from 'styled-components/macro';
import * as icons from 'style/icon';

type Props = {
    prefix: string
    state: "inGame"|"private"
    onChange: () => void
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

    return ( // TODO formgroup or similar
        <StyledRow>
            <UI.RadioLink id={`${prefix}-set-in-game`} name={`${prefix}-location`}
                          type="radio" light
                          checked={state === "inGame"} onChange={onChange}>
                <UI.TextWithIcon>
                    <UI.FAIcon transform="grow-5" icon={icons.faUsers} />
                    in game
                </UI.TextWithIcon>
            </UI.RadioLink>
            <UI.RadioLink id={`${prefix}-set-to-gm`} name={`${prefix}-location`}
                          type="radio" light disabled
                          checked={false} onChange={function() {}}>
                <UI.TextWithIcon>
                    <UI.FAIcon transform="grow-3" icon={icons.faUserFriends} />
                    to GM
                </UI.TextWithIcon>
            </UI.RadioLink>
            <UI.RadioLink id={`${prefix}-set-private`} name={`${prefix}-location`}
                          type="radio" light
                          checked={state === "private"}
                          onChange={onChange}>
                <UI.TextWithIcon>
                    <UI.FAIcon transform="grow-2" icon={icons.faUserSecret} />
                    just me
                </UI.TextWithIcon>
            </UI.RadioLink>
        </StyledRow>
    );
}
