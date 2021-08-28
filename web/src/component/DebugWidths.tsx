import styled from 'styled-components';

import * as layout from 'layout';

const Wrapper = styled.div({
    fontFamily: layout.Fonts.Monospace,
    "& div": {
        height: "1rem"
    }
});

type WidthProps = {
    width: string,
}

const Breakpoint = styled.div<WidthProps>(({ width }) => ({
    backgroundColor: "blue",
    color: "white",
    width,
}));

const Phone = styled.div<WidthProps>(({ width }) => ({
    backgroundColor: "blue",
    color: "white",
    width,
}));

const Tablet = styled.div<WidthProps>(({ width }) => ({
    backgroundColor: "blue",
    color: "white",
    width,
}));

const Monitor = styled.div<WidthProps>(({ width }) => ({
    backgroundColor: "blue",
    color: "white",
    width,
}));

export default function DebugWidths() {
    return (
        <Wrapper>
            <Phone width="19rem">19rem Phone Min</Phone>
            <Breakpoint width={`${layout.MENU_MIN}rem`}>{layout.MENU_MIN}rem Menu min</Breakpoint>
            <Phone width="31rem">31rem Phone Max</Phone>
            <Tablet width="48rem">48rem iPad portrait</Tablet>
            <Breakpoint width={`${layout.COLUMNS_BREAKPOINT}rem`}>{layout.COLUMNS_BREAKPOINT}rem Column -&gt; Stacked</Breakpoint>
            <Tablet width="64rem">64rem iPad landscape</Tablet>
            <Monitor width="80rem">80rem 720p landscape/MDPI landscape</Monitor>
            <Monitor width="120rem">120rem 1080p landscape</Monitor>
            {/*<Monitor width="240rem">240rem 4k landscape</div>*/}
        </Wrapper>
    );
}
