import * as React from "react";
import { act, render, screen } from "@testing-library/react";

import * as server from 'server';
import App from "./App";

/*:: declare var beforeEach: (() => void) => void */
/*:: declare var afterEach: (() => void) => void */
/*:: declare var beforeEach: (() => void) => void */
/*:: declare var expect: (any) => any */

test("renders without crashing", () => {
    render(<App />);
    expect(screen.getByText("Join")).toBeDefined();
    expect(screen.getByText("Shadowroller")).toBeDefined();
});
