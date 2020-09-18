// @flow

export * from './events';
export * from './auth';
export * from './request';
export * from './routes';

export const BACKEND_URL = process.env.NODE_ENV === 'production' ?
    'https://shadowroller.net/'
    : document.location.toString().replace(':3000', ':3001').replace('/shadowroller', '/');
