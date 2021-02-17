export * from './events';
export * from './auth';
export * from './request';

export const BACKEND_URL = process.env.NODE_ENV === 'production' ?
    'https://shadowroller.net/'
    : document.location.toString().replace(/:\d+/, ':3001').replace('/shadowroller', '/');
