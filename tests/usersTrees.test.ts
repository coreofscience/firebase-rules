import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { describe, it } from "vitest";

import { setupTestHooks } from "./utils/setupTestHooks";

describe("users/{userId}/trees collection", async () => {
  const testEnv = await setupTestHooks();

  it("cannot write without authentication", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(addDoc(collection(db, "users/userId/trees"), {}));
  });

  it("cannot read without authentication", async () => {
    await testEnv.withSecurityRulesDisabled(
      async (ctx) =>
        await setDoc(doc(ctx.firestore(), "users/userId/trees/treeId"), {}),
    );

    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(db, "users/userId/trees/treeId")));
  });

  it("can read with authentication", async () => {
    await testEnv.withSecurityRulesDisabled(
      async (ctx) =>
        await setDoc(doc(ctx.firestore(), "users/userId/trees/treeId"), {}),
    );

    const db = testEnv
      .authenticatedContext("userId", { planId: "basic" })
      .firestore();

    await assertSucceeds(getDoc(doc(db, "users/userId/trees/treeId")));
  });

  it("can write with authentication", async () => {
    await testEnv.withSecurityRulesDisabled(
      async (ctx) =>
        await setDoc(doc(ctx.firestore(), "users/userId/trees/treeId"), {}),
    );

    const db = testEnv
      .authenticatedContext("userId", { planId: "basic" })
      .firestore();

    await assertSucceeds(
      setDoc(doc(db, "users/userId/trees/treeId"), { planId: "basic" }),
    );
  });

  it("cannot be created on behalf of someone else authenticated", async () => {
    const db = testEnv
      .authenticatedContext("userId", { plan: "basic" })
      .firestore();

    await assertFails(addDoc(collection(db, "users/someoneElse/trees"), {}));
  });

  it("cannot be read on behalf of someone else authenticated", async () => {
    await testEnv.withSecurityRulesDisabled(
      async (ctx) =>
        await setDoc(
          doc(ctx.firestore(), "users/someoneElse/trees/treeId"),
          {},
        ),
    );

    const db = testEnv
      .authenticatedContext("userId", { plan: "basic" })
      .firestore();

    await assertFails(getDoc(doc(db, "users/someoneElse/trees/treeId")));
  });

  it("basic tree can be created by an user with the pro plan", async () => {
    const db = testEnv
      .authenticatedContext("userId", { plan: "pro" })
      .firestore();

    await assertSucceeds(
      addDoc(collection(db, "users/userId/trees"), { planId: "basic" }),
    );
  });

  it("pro tree cannot be created by an user with the basic plan", async () => {
    const db = testEnv
      .authenticatedContext("userId", { plan: "basic" })
      .firestore();

    await assertFails(
      addDoc(collection(db, "users/userId/trees"), { planId: "pro" }),
    );
  });

  it("basic tree can be created by an user with the basic plan", async () => {
    const db = testEnv
      .authenticatedContext("userId", { plan: "basic" })
      .firestore();

    await assertSucceeds(
      addDoc(collection(db, "users/userId/trees"), { planId: "basic" }),
    );
  });

  it("pro tree can be created by an user with the pro plan", async () => {
    const db = testEnv
      .authenticatedContext("userId", { plan: "pro" })
      .firestore();

    await assertSucceeds(
      addDoc(collection(db, "users/userId/trees"), { planId: "pro" }),
    );
  });

  it("basic tree can be created by an user witout a plan id", async () => {
    const db = testEnv.authenticatedContext("userId").firestore();

    await assertSucceeds(
      addDoc(collection(db, "users/userId/trees"), { planId: "basic" }),
    );
  });

  it("can be created by unauthenticated users", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(addDoc(collection(db, "trees"), { planId: null }));
  });
});
