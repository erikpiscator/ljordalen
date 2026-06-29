import "server-only";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Initializes the Firebase Admin SDK exactly once. Credentials resolve from,
// in order of preference:
//   1. FIREBASE_SERVICE_ACCOUNT_KEY  (raw JSON or base64 — handy for local dev)
//   2. Application Default Credentials (automatic on App Engine; or via
//      GOOGLE_APPLICATION_CREDENTIALS locally)
function init(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT;
  const storageBucket = process.env.STORAGE_BUCKET;

  // Local dev: when the Firestore emulator is running, the Admin SDK routes to
  // it automatically and no real credentials are needed.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: projectId || "demo-bjornas" });
  }

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (rawKey) {
    const json = JSON.parse(
      rawKey.startsWith("{")
        ? rawKey
        : Buffer.from(rawKey, "base64").toString("utf8"),
    );
    return initializeApp({
      credential: cert(json),
      projectId: json.project_id || projectId,
      storageBucket,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
    storageBucket,
  });
}

const app = init();

export const db = getFirestore(app);
export const storage = getStorage(app);

// Collection name constants — single source of truth.
export const MEMBERS = "members";
export const BOOKINGS = "bookings";
export const ACCESS_REQUESTS = "accessRequests";
export const LOGIN_CODES = "loginCodes";
export const ANNOUNCEMENTS = "announcements";
// Subcollections under an announcement doc.
export const COMMENTS = "comments";
export const REACTIONS = "reactions";
