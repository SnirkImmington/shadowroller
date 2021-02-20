import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';

// Flow type for the tests.
/*:: declare var it: (name: string, action: () => void) => void; */

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
});
