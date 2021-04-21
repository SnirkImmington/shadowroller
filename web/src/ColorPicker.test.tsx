import * as React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';

import ColorPicker from './ColorPicker';

const getInput = () => screen.getByRole("slider");
const setInput = (value: string) => fireEvent.change(getInput(), { target: { value } });

describe("input", function() {
    it("accepts value param", async () => {
        const hue = 12;

        render(<ColorPicker value={hue} onSelect={() => {}} />);

        expect(getInput()).toHaveValue(hue.toString());
    });

    it("calls onSelect", async () => {
        let hue = 12;
        let onSelect = jest.fn();

        render(<ColorPicker value={hue} onSelect={onSelect} />);

        setInput(13);

        expect(onSelect).toHaveBeenCalledWith(13);
    });
});

describe("props", function() {
    it("passes through id", async () => {
        let id = "just-a-small-time-color-picker";

        render(<ColorPicker id={id} value={12} onSelect={() => { }} />);

        expect(getInput()).toHaveAttribute("id", id);
    });

    it("passes through disabled", async () => {
        render(<ColorPicker disabled value={12} onSelect={() => { }} />);

        expect(getInput()).toBeDisabled();
    });

    // Skipping the style param as there's not a good way to get the div
});
