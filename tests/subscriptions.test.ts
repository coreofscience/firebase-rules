import { describe, it } from "vitest";

import { setupTestHooks } from "./utils/setupTestHooks";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";

describe("subscriptions", async () => {
  const testEnv = await setupTestHooks();

  it("cannot be written by unauthenticated users", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(addDoc(collection(db, "subscriptions"), {}));
  });

  it("cannot be written on behalf of other users", async () => {
    const db = testEnv.authenticatedContext("userId").firestore();
    await assertFails(setDoc(doc(db, "subscriptions", "otherUserId"), {}));
  });

  it("cannot be written without an email verified", async () => {
    const db = testEnv.authenticatedContext("userId").firestore();
    await assertFails(setDoc(doc(db, "subscriptions", "userId"), {}));
  });

  it("can be written by authenticated users with an email verified", async () => {
    const db = testEnv
      .authenticatedContext("userId", { email_verified: true })
      .firestore();
    await assertSucceeds(setDoc(doc(db, "subscriptions", "userId"), {}));
  });
});
