import { DataToken, Token } from "./tokens";

export class LocalExchange {
  private dataToTokens = new Map<unknown, DataToken>();
  private tokensToData = new Map<DataToken["id"], unknown>();

  register<T>(data: T, isStatic = true): DataToken {
    if (this.dataToTokens.has(data)) {
      return this.dataToTokens.get(data);
    }

    const token: DataToken = {
      type: "data",
      id: undefined,
      isLocal: true,
      isStatic,
    };

    this.dataToTokens.set(data, token);
    this.tokensToData.set(token.id, data);

    return token;
  }

  resolve<T>(token: DataToken): T {
    if (!this.tokensToData.has(token.id)) {
      throw new Error(`cannot resolve token ${token}`);
    }

    return this.tokensToData.get(token.id) as T;
  }
}

export interface RemoteExchange {
  resolve<T>(token: Token<T>): Promise<T>;
}

const isLocal = (token: Token<unknown>): boolean =>
  token.type === "data"
    ? token.isLocal
    : token.type === "call"
    ? isLocal(token.func)
    : isLocal(token.target);

export class Exchange {
  constructor(
    private localExchange: LocalExchange,
    private remoteExchange: RemoteExchange
  ) {}

  register: LocalExchange["register"] = (data) =>
    this.localExchange.register(data);

  async resolve<T>(token: Token<T>): Promise<T> {
    if (isLocal(token)) {
      if (token.type === "data") {
        return Promise.resolve(this.localExchange.resolve(token));
      }
      if (token.type === "call") {
        const func = (await this.resolve(token.func)) as (
          ...args: unknown[]
        ) => T;
        const args = await Promise.all(
          token.args.map((arg) => this.resolve(arg))
        );
        return func(...args);
      }
      if (token.type === "get") {
        const target = await this.resolve(token.target);
        return target[token.prop];
      }
      throw new Error(
        `invalid token type "${(token as any).type}" in ${token}`
      );
    } else {
      if (token.type === "data" && !token.isStatic) {
        throw new Error(`cannot resolve non-static remote data token ${token}`);
      }

      return this.remoteExchange.resolve(token);
    }
  }
}
