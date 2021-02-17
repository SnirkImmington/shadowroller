import styled, { StyledComponent } from 'styled-components/macro';

type RecordProps = {
    style: any,
    color: string,
    bg?: string,
    //+eventDispatch: Event.Dispatch,
};

// Spacing between event records
const GUTTER_SIZE = 4;

export const StyledRecord: StyledComponent<"div", any, RecordProps> = styled.div.attrs(
    props => {
        const style = {
            ...props.style,
            top: (props.style?.top + GUTTER_SIZE) || 0,
            height: (props.style?.height - GUTTER_SIZE) || 'auto',
        };
        if (props.editing) {
            props.style.backgroundColor = props.color === "slategray" ?
                "#efefef" : props.color.replace("80%", "8%").replace("56%", "96%");
        }
        return { style };
})`
    padding-bottom: 4px;
    padding-left: 5px;
    padding-right: 2px;
    ${({color}) =>
        `border-left: 5px solid ${color};`
    }
    line-height: 1;
`;

export * from './roll';
export * from './otherEvents';
export { EdgeRoll } from './EdgeRoll';
export { Reroll } from './reroll';
export { RollRecord as Roll } from './roll';
export { Initiative } from './initiative';
