export type DataToken = {
  type: "data";
  id: string;
  isLocal: boolean;
  isStatic: boolean;
};

type TokenizeParameters<F> = F extends (...args: infer P) => unknown
  ? TokenizeAll<P>
  : never;
export type CallToken<F extends (...args: unknown[]) => unknown> = {
  type: "call";
  func: Token<F>;
  args: TokenizeParameters<F>;
};
export const callToken = <F extends (...args: unknown[]) => unknown>(
  func: Token<F>,
  ...args: TokenizeParameters<F>
): CallToken<F> => ({ type: "call", func, args });

export type GetToken<T, P extends keyof T> = {
  type: "get";
  target: Token<T>;
  prop: P;
};
export const getToken = <T, P extends keyof T>(
  target: Token<T>,
  prop: P
): GetToken<T, P> => ({ type: "get", target, prop });

export type Token<T> =
  | DataToken
  | CallToken<(...args: unknown[]) => unknown>
  | GetToken<any, any>;
type TokenizeAll<T> = { [K in keyof T]: Token<T[K]> };
