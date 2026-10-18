/**
 * Firebase web config from `EXPO_PUBLIC_FIREBASE_*` variables (see `.env.example`).
 * These identify the project; they are not secrets, but they are public in the built app by design,
 * so access is controlled by `firestore.rules`, never by hiding them.
 * Expo inlines only static `process.env.EXPO_PUBLIC_X` references, so each one is written out below.
 */

export type FirebaseConfig = {
  apiKey: string;
  projectId: string;
  appId: string;
};

type RawEnv = Partial<Record<'apiKey' | 'projectId' | 'appId', string | undefined>>;

const defaultEnv: RawEnv = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const VARIABLE_NAMES = {
  apiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
  projectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  appId: 'EXPO_PUBLIC_FIREBASE_APP_ID',
} as const;

/** Throws one error naming every missing variable. */
export function readFirebaseConfig(env: RawEnv = defaultEnv): FirebaseConfig {
  const missing = (Object.keys(VARIABLE_NAMES) as (keyof typeof VARIABLE_NAMES)[]).filter(
    (key) => !env[key]?.trim(),
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase settings: ${missing.map((key) => VARIABLE_NAMES[key]).join(', ')}. Copy .env.example to .env.local and fill them in.`,
    );
  }
  return {
    apiKey: env.apiKey!.trim(),
    projectId: env.projectId!.trim(),
    appId: env.appId!.trim(),
  };
}

/** Optional `host:port` of a local Firestore emulator, for development and tests. */
export function readEmulatorHost(): string | undefined {
  return process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST?.trim() || undefined;
}
