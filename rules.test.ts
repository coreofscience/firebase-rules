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
  setDoc,
  setLogLevel,
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

describe("creation of pro and non-pro trees", () => {
  it("cannot be created by unauthenticated users", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      addDoc(collection(db, "users/userId/trees"), {
        this: "is a tree",
        planId: "basic",
      })
    );
  });

  it("cannot be created on behalf of someone else", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "basic",
    }).firestore();
    await assertFails(
      addDoc(collection(db, "users/someoneElse/trees"), {
        this: "is a tree",
        planId: "basic",
      })
    );
  });

  it("can be created by the actual user with a pro plan", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "pro"
    }).firestore();
    await assertSucceeds(
      addDoc(collection(db, "users/userId/trees"), {
        this: "is a  pro tree",
        planId: "pro",
      })
    );
  })

  it("basic tree cannot be created by an user with the pro plan", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "pro"
    }).firestore();
    await assertFails(
      addDoc(collection(db, "users/userId/trees"), {
        this: "is a tree",
        planId: "basic",
      })
    );
  })

  it("the basic tree can be created by an user with the basic plan", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "basic"
    }).firestore();
    await assertSucceeds(
      addDoc(collection(db, "users/userId/trees"), {
        this: "is a tree",
        planId: "basic",
      })
    );
  })

  it("pro tree cannot be created by an user with the basic plan", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "basic"
    }).firestore();
    await assertFails(
      addDoc(collection(db, "users/userId/trees"), {
        this: "is a pro tree",
        planId: "pro",
      })
    );
  })

  it("can be created by unauthenticated users", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(
      addDoc(collection(db, "trees"), {
        this: "is a tree",
        planId: null,
      })
    );
  });
});

describe("tree reads", () => {
  it("cannot be read by unauthenticated users", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDocs(collection(db, "users/userId/trees")));
  });

  it("cannot read someone else's trees", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "basic",
    }).firestore();
    await assertFails(getDocs(collection(db, "users/someoneElse/trees")));
  });

  it("users can read their own trees", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "basic",
    }).firestore();
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

describe("basic analysis creates", () => {
  it("cannot be created by unauthenticated user", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      addDoc(collection(db, "users/userId/basicAnalysis"), {
        createdDate: new Date().getTime(),
      })
    );
  });

  it("cannot be created on behalf of someone else", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "basic",
    }).firestore();
    await assertFails(
      addDoc(collection(db, "users/someoneElse/basicAnalysis"), {
        createdDate: new Date().getTime(),
      })
    );
  });

  it("cannot be create by an user with the pro plan", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "pro"
    }).firestore()
    await assertFails(
      addDoc(collection(db, "users/userId/basicAnalysis"), {
        createdDate: new Date().getTime(),
        planId: "pro",
      })
    );
  });

  it("can be created by an user with the basic plan", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "basic"
    }).firestore();
    await assertSucceeds(
      addDoc(collection(db, "users/userId/basicAnalysis"), {
        createdDate: new Date().getTime(),
        planId: "basic",
      })
    );
  });

  it("basic analysis cannot be created by an user with the pro plan", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "pro"
    }).firestore();
    await assertFails(
      addDoc(collection(db, "users/userId/basicAnalysis"), {
        createdDate: new Date().getTime(),
        planId: "basic",
      })
    );
  });

});

describe("pro analysis creates", () => {
  it("cannot be created by unauthenticated user", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      addDoc(collection(db, "users/userId/proAnalysis"), {
        createdDate: new Date().getTime(),
      })
    )
  });

  it("cannot be created on behalf of someone else", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "pro",
    }).firestore();
    await assertFails(
      addDoc(collection(db, "users/someoneElse/proAnalysis"), {
        createdDate: new Date().getTime(),
      })
    );
  });

  it("cannot be created by an user with the basic plan", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "basic"
    }).firestore()
    await assertFails(
      addDoc(collection(db, "users/userId/proAnalysis"), {
        createdDate: new Date().getTime(),
        planId: "basic",
      })
    )
  });

  it("can be created by an user with the pro plan", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "pro"
    }).firestore();
    await assertSucceeds(
      addDoc(collection(db, "users/userId/proAnalysis"), {
        createdDate: new Date().getTime(),
        planId: "pro",
      })
    );
  });

  it("pro analysis cannot be created by an user with the basic plan", async () => {
    const db = testEnv.authenticatedContext("userId", {
      plan: "basic"
    }).firestore();
    await assertFails(
      addDoc(collection(db, "users/userId/proAnalysis"), {
        createdDate: new Date().getTime(),
        planId: "pro",
      })
    );
  });
});
