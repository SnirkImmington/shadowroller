import styled from 'styled-components/macro';

type RecordProps = {
    style: any,
    color: string,
    bg?: string,
    editing?: boolean
    //+eventDispatch: Event.Dispatch,
};

// Spacing between event records
const GUTTER_SIZE = 4;

export const StyledRecord = styled.div.attrs<RecordProps>(
    props => {
        const style = {
            ...props.style,
            top: (props.style?.top + GUTTER_SIZE) || 0,
            height: (props.style?.height - GUTTER_SIZE) || 'auto',
        };
        if (props.editing) {
            props.style.backgroundColor = props.color === "lightslategray" ?
                "#efefef" : props.color.replace("80%", "8%").replace("56%", "96%");
        }
        return { style };
})<RecordProps>`
    padding-bottom: 4px;
    padding-left: 5px;
    padding-right: 2px;
    border-left: 5px solid ${({color}) => color};
    line-height: 1;
`;

export * from './Roll';
export * from './OtherEvents';
export { EdgeRoll } from './EdgeRoll';
export { Reroll } from './Reroll';
export { RollRecord as Roll } from './Roll';
export { Initiative } from './Initiative';
