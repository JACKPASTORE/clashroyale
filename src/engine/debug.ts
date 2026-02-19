export const DEBUG_LOGS =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  !!window.localStorage &&
  window.localStorage.getItem('debugLogs') === '1';

