import { ThemeProvider } from "styled-components/macro";

import * as fc from 'fast-check';
import * as fcUtils from 'fc-utils.test';

import * as theme from 'theme';
import { render, fireEvent, screen } from '@testing-library/react';

import type { Selector } from 'component/NumericInput';
import type { Setter } from 'srutil';

import GlitchyInput, { Props } from "./GlitchyInput";

export type RenderOptions = Partial<Props>;

/** Generates arbitrary props for this component */
export function props(args?: RenderOptions): fc.Arbitrary<Props> {
    return fc.record({
        baseID: args?.baseID ? fc.constant(args.baseID) : fcUtils.htmlID(),
        color: args?.color ? fc.constant(args.color) : fcUtils.color(),
        glitchy: args?.glitchy ? fc.constant(args.glitchy) : fc.integer({ min: -20, max: 20 }),
        setGlitchy: fc.constant(args?.setGlitchy ?? (() => { })),
        onGlitchySelect: fc.constant(args?.onGlitchySelect ?? (() => { }))
    });
};

export function renderGlitchyInput(options?: RenderOptions) {
    return render(
        <GlitchyInput
            baseID={options?.baseID ?? "glitchy"}
            color={options?.color ?? "red"}
            glitchy={options?.glitchy ?? 0}
            setGlitchy={options?.setGlitchy ?? (() => { })}
            onGlitchySelect={options?.onGlitchySelect ?? (() => { })} />
    );
}

describe("baseID", function () {
    fcUtils.property("uses the base ID for all subcomponents", props(),
        (props: Props) => {
            renderGlitchyInput(props);


        }
    );
});

describe("label", function () {
    fcUtils.property("does not show for 0 glitchy",
        props({ glitchy: 0 }),
        (props: Props) => {
            const glitchy = renderGlitchyInput(props);

            expect(glitchy.getAllByText("Reduce")).toHaveLength(0);
            expect(glitchy.getAllByText("Increase")).toHaveLength(0);
        }, fcUtils.fewerRuns()
    );

    fcUtils.property("shows reduction in number of 1s needed",
        props().map(p => ({ ...p, glitchy: Math.abs(p.glitchy) + 1 })),
        (props: Props) => {
            const glitchy = renderGlitchyInput(props);

            expect(glitchy.getAllByText("Reduce")).toHaveLength(0);
            expect(glitchy.getByText(props.glitchy.toString())).toBeTruthy();
        }, fcUtils.fewerRuns()
    );

    fcUtils.property("shows increase in number of 1s needed",
        props().map(p => ({ ...p, glitchy: -Math.abs(p.glitchy) - 1 })),
        (props: Props) => {
            const glitchy = renderGlitchyInput(props);

            expect(glitchy.getAllByText("Increase")).toHaveLength(0);
            expect(glitchy.getByText(props.glitchy.toString())).toBeTruthy();
        }, fcUtils.fewerRuns()
    );
});
