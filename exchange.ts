import { assert } from "console";

type DataSource = "js" | "py";
type DataToken = { source: DataSource; id: string }

type ExchangeData<T> =
  | { recursive: false, resolved: boolean, data: T, token: DataToken }
  | (T extends object
      ? {
          recursive: true,
          resolved: boolean,
          data: { [K in keyof T]: ExchangeData<T[K]> };
          token: DataToken
        }
      : never);

interface Exchange {
  resolve<T>(token: DataToken, recursive?: boolean): Promise<ExchangeData<T>>;

  get<T>(targetToken: DataToken, p: keyof T): Promise<DataToken>;
}

const exchangeProxy = async <T>(exchange: Exchange, token: DataToken) => {
  const exchangeData = await exchange.resolve<T>(token)
  assert(exchangeData.resolved);

  if(!exchangeData.recursive) {
    return exchangeData.data
  } else {
    return new Proxy({}, {
      get: (target, p: keyof T) => {
        if(!exchangeData.data[p].resolved) {
          return (async () => {
            exchangeData.data[p] = await exchange.resolve<T[typeof p]>(exchangeData.data[p].token)
            return exchangeProxy(exchange, )
          })() as Promise<T[typeof p]>;
        }
      }
    })
  }
}