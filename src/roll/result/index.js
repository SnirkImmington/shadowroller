// @flow

import CountHitsResult from './count-hits';
import RollAgainstResult from './roll-against';
import TestForResult from './test-for';

export type RollOutcome =
| CountHitsResult
| RollAgainstResult
| TestForResult;
