import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  setLogLevel,
  where,
} from "firebase/firestore";
import { readFileSync } from "fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  setLogLevel("error");
  testEnv = await initializeTestEnvironment({
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    projectId: "coreofscience-dev",
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("tree creation", () => {
  it("cannot be created by unauthenticated users", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      addDoc(collection(db, "users/userId/trees"), { this: "is a tree" })
    );
  });

  it("cannot be created on behalf of someone else", async () => {
    const db = testEnv.authenticatedContext("userId").firestore();
    await assertFails(
      addDoc(collection(db, "users/someoneElse/trees"), {
        this: "is a tree",
      })
    );
  });

  it("can be created by the actual user", async () => {
    const db = testEnv.authenticatedContext("userId").firestore();
    await assertSucceeds(
      addDoc(collection(db, "users/userId/trees"), {
        this: "is a tree",
      })
    );
  });
});

describe("tree reads", () => {
  it("cannot be read by uauthenticated users", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDocs(collection(db, "users/userId/trees")));
  });

  it("cannot read someone elses trees", async () => {
    const db = testEnv.authenticatedContext("userId").firestore();
    await assertFails(getDocs(collection(db, "users/someoneElse/trees")));
  });

  it("users can read their own trees", async () => {
    const db = testEnv.authenticatedContext("userId").firestore();
    await assertSucceeds(getDocs(collection(db, "users/userId/trees")));
  });
});

describe("tree updates", () => {
  it("users can update their own trees", async () => {
    await testEnv.withSecurityRulesDisabled(
      async (ctx) =>
        await setDoc(doc(ctx.firestore(), "users/userId/trees/treeId"), {
          this: "is a tree",
        })
    );
    const db = testEnv.authenticatedContext("userId").firestore();
    await assertSucceeds(
      setDoc(doc(db, "users/userId/trees/treeId"), {
        this: "is an updated tree",
      })
    );
  });
});

describe("tree deletes", () => {
  it("users can delete their own trees", async () => {
    await testEnv.withSecurityRulesDisabled(
      async (ctx) =>
        await setDoc(doc(ctx.firestore(), "users/userId/trees/treeId"), {
          this: "is a tree",
        })
    );
    const db = testEnv.authenticatedContext("userId").firestore();
    await assertSucceeds(deleteDoc(doc(db, "users/userId/trees/treeId")));
  });
});
