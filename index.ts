import { Exchange } from "./exchange";
import { importToken } from "./tokens";
import { PromiseProxy, promiseProxy } from "./exchange-proxy";
import { spawnPythonExchange } from "./python-exchange";

export const requirePy = (() => {
  let pythonExchange: Exchange = null;
  return <T>(moduleName: string): PromiseProxy<T> => {
    if (!pythonExchange) pythonExchange = spawnPythonExchange();
    return promiseProxy(pythonExchange, importToken(moduleName, "py"));
  };
})();
