declare module 'regenerator-runtime/runtime.js' {
  const runtime: {
    wrap: (...args: unknown[]) => unknown;
    mark: (...args: unknown[]) => unknown;
    awrap: (...args: unknown[]) => unknown;
    [key: string]: unknown;
  };
  export default runtime;
}
