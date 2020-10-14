export type Require = {
  <T = unknown>(moduleName: string): T;
};

export async function python<R>(callback: (require: Require) => R): Promise<R> {
  
  const require: Require = <T>(moduleName: string): T =>
    (new Proxy(function (...args: unknown[]) {

    }, {}) as unknown) as T;

  return callback(require);
}
