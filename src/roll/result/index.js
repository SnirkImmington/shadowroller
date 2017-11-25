// @flow

import CountHitsResult from './count-hits';
import RollAgainstResult from './roll-against';
import TestForResult from './test-for';
import DisplayResult from './display';

export type RollOutcome =
| CountHitsResult
| RollAgainstResult
| DisplayResult
| TestForResult;
