import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { setLogLevel } from "firebase/firestore";
import { readFileSync } from "fs";
import { afterAll, beforeEach } from "vitest";

export const setupTestHooks = async () => {
  setLogLevel("error");
  const testEnv = await initializeTestEnvironment({
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    projectId: "coreofscience-dev",
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  return testEnv;
};
