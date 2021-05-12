import * as React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

it('renders main app', () => {
    render(<App />);

    const header = screen.getByText(/Shadowroller/i);
    expect(header).toBeInTheDocument();
});
