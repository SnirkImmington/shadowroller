// @flow

import * as Game from 'game';
import * as Event from 'event';
import * as connection from 'connection';

import * as events from './events';

export * from './events';
export * from './auth';
export * from './request';
export * from './routes';

export const BACKEND_URL = process.env.NODE_ENV === 'production' ?
    'https://shadowroller.immington.industries/'
    : document.location.toString().replace(':3000', ':3001').replace('/shadowroller', '/');
