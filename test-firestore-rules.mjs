import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

const env = await initializeTestEnvironment({
  projectId: "roy-bari-durga-puja",
  firestore: {
    host: "127.0.0.1",
    port: 8080,
    rules: readFileSync("./firestore.rules", "utf8").replace(/^\uFEFF/, "")
  }
});

try {
  await env.clearFirestore();

  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, "events", "test-event"), {
      title: "Test event"
    });

    await setDoc(doc(db, "activityLogs", "test-log"), {
      action: "Test"
    });
  });

  const visitor = env.unauthenticatedContext().firestore();

  const ordinaryUser = env
    .authenticatedContext("ordinary-user")
    .firestore();

  const admin = env
    .authenticatedContext("admin-user", { admin: true })
    .firestore();

  console.log("Testing public event read...");
  await assertSucceeds(
    getDoc(doc(visitor, "events", "test-event"))
  );

  console.log("Testing visitor cannot edit events...");
  await assertFails(
    setDoc(doc(visitor, "events", "test-event"), {
      title: "Unauthorized edit"
    })
  );

  console.log("Testing ordinary user cannot edit events...");
  await assertFails(
    setDoc(doc(ordinaryUser, "events", "test-event"), {
      title: "Unauthorized edit"
    })
  );

  console.log("Testing admin can edit events...");
  await assertSucceeds(
    setDoc(doc(admin, "events", "test-event"), {
      title: "Admin edit"
    })
  );

  console.log("Testing public enquiry submission...");
  await assertSucceeds(
    addDoc(collection(visitor, "enquiries"), {
      name: "Test Visitor",
      email: "visitor@example.com",
      reason: "General enquiry",
      message: "Testing the contact form",
      createdAt: serverTimestamp()
    })
  );

  console.log("Testing visitor cannot read enquiries...");
  await assertFails(
    getDoc(doc(visitor, "enquiries", "test-enquiry"))
  );

  console.log("Testing ordinary user cannot read activity logs...");
  await assertFails(
    getDoc(doc(ordinaryUser, "activityLogs", "test-log"))
  );

  console.log("Testing admin can read activity logs...");
  await assertSucceeds(
    getDoc(doc(admin, "activityLogs", "test-log"))
  );

  console.log("\nAll Firestore security tests passed.");
} catch (error) {
  console.error("\nSecurity test failed:", error);
  process.exitCode = 1;
} finally {
  await env.cleanup();
}
