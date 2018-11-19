// @flow

import typeof CountHitsResult from './count-hits';
import typeof RollAgainstResult from './roll-against';
import typeof TestForResult from './test-for';

export type RollOutcome =
| CountHitsResult
| RollAgainstResult
| TestForResult;
