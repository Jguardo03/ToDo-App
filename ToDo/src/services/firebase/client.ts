import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

import { readEmulatorHost, readFirebaseConfig } from '@/services/firebase/config';

let db: Firestore | undefined;

/** The one Firestore instance. Created on first use so importing this file needs no configuration. */
export function getDb(): Firestore {
  if (!db) {
    const app = getApps().length > 0 ? getApp() : initializeApp(readFirebaseConfig());
    db = getFirestore(app);
    const emulator = readEmulatorHost();
    if (emulator) {
      const [host, port] = emulator.split(':');
      connectFirestoreEmulator(db, host, Number(port));
    }
  }
  return db;
}
