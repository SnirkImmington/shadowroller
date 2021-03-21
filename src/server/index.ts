export * from './events';
export * from './auth';
export * from './request';

export const BACKEND_URL = process.env.NODE_ENV === 'production' ?
    process.env.BACKEND_URL
    : document.location.toString().replace(/:\d+/, ':3001').replace('/shadowroller', '/');
