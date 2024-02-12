import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { describe, it } from "vitest";

import { setupTestHooks } from "./utils/setupTestHooks";

const collectionsWithSameBehavior = ["users", "plans"] as const;

describe.each(collectionsWithSameBehavior)(
  "%s collection",
  async (collectionName) => {
    const testEnv = await setupTestHooks();

    it("cannot write without authentication", async () => {
      const db = testEnv.unauthenticatedContext().firestore();

      await assertFails(addDoc(collection(db, collectionName), {}));
    });

    it("cannot read without authentication", async () => {
      await testEnv.withSecurityRulesDisabled(
        async (ctx) =>
          await setDoc(doc(ctx.firestore(), `${collectionName}/userId`), {}),
      );

      const db = testEnv.unauthenticatedContext().firestore();

      await assertFails(getDoc(doc(db, `${collectionName}/userId`)));
    });

    it("can read with authentication", async () => {
      const db = testEnv
        .authenticatedContext("userId", { planId: "basic" })
        .firestore();

      await assertSucceeds(getDoc(doc(db, `${collectionName}/userId`)));
    });
  },
);
