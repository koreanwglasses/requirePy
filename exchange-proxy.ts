import { Exchange } from "./exchange";
import { callToken, getToken, Token } from "./tokens";

export type PromiseProxy<T> = (T extends (...args: infer P) => infer R
  ? (...args: P) => PromiseProxy<R>
  : T extends object
  ? { [K in keyof T]: PromiseProxy<T[K]> }
  : unknown) &
  PromiseLike<T> & { __promiseProxy: { token: Token<T> } };

const isPromiseProxy = (x: unknown): x is PromiseProxy<unknown> =>
  typeof x === "object" && "__promiseProxy" in x;

export const promiseProxy = <T>(exchange: Exchange, token: Token<T>) =>
  new Proxy(
    function (...args: unknown[]) {
      const argTokens = args.map((arg) =>
        isPromiseProxy(arg)
          ? arg.__promiseProxy.token
          : exchange.register(
              arg,
              typeof arg !== "object" && typeof arg !== "function"
            )
      );
      return promiseProxy(exchange, callToken(token, ...argTokens));
    } as object,
    {
      get: (target, p: keyof T) => {
        if (p === "then") {
          return exchange.resolve<T>(token).then;
        }
        return promiseProxy(exchange, getToken(token, p));
      },
    }
  ) as PromiseProxy<T>;
