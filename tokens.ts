export type DataToken = {
  type: "data";
  id: string | number;
  source: "js"|"py";
  isStatic: boolean;
};

export type ImportToken = {
  type: "import";
  source: "js"|"py";
  moduleName: string;
};
export const importToken = (
  moduleName: string,
  source: "js"|"py"
): ImportToken => ({ type: "import", source, moduleName });

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
  | ImportToken
  | CallToken<(...args: unknown[]) => unknown>
  | GetToken<any, string | number | symbol>;
type TokenizeAll<T> = { [K in keyof T]: Token<T[K]> };
