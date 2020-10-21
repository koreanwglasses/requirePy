import { requirePy } from "./index";

async () => {
  const testPy = requirePy<{ add(a: number, b: number): number }>("test");
  const result = await testPy.add(1, 2);
};
