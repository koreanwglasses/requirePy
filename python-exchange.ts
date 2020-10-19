import { Exchange } from "./exchange";
import { Multiplexer } from "./multiplexer";
import * as child_process from "child_process";
import { Readable, Writable } from "stream";

export const spawnPythonExchange = () => {
  const child = child_process.spawn(`python3 ${__dirname}/py/__init__.py`, {
    stdio: [process.stdin, process.stdout, process.stderr, "pipe", "pipe"],
  });
  const mux = new Multiplexer(
    child.stdio[3] as Readable,
    child.stdio[4] as Writable
  );
  return new Exchange(mux);
};
