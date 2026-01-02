import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let firebaseApp: admin.app.App;

export const initializeFirebase = (): admin.app.App => {
  if (firebaseApp) {
    return firebaseApp;
  }

  console.log('[2026-01-01T16:52:16.238Z] INFO: Initializing Firebase Admin SDK...');

  try {
    let credential: admin.credential.Credential;

    // Option 1: JSON string in environment variable (Cloud Run with Secret Manager)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('Using FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = admin.credential.cert(serviceAccount);
    }
    // Option 2: File path (local development)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
      console.log('Using FIREBASE_SERVICE_ACCOUNT_KEY_PATH (file)');
      const absolutePath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
      
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Firebase service account key not found at: ${absolutePath}`);
      }

      const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
    }
    // Option 3: Google Application Default Credentials (Cloud Run default)
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
      console.log('Using Application Default Credentials');
      credential = admin.credential.applicationDefault();
    }
    else {
      throw new Error(
        'Firebase credentials not configured. Set one of: ' +
        'FIREBASE_SERVICE_ACCOUNT_KEY (JSON string), ' +
        'FIREBASE_SERVICE_ACCOUNT_KEY_PATH (file path), ' +
        'or run in Google Cloud environment'
      );
    }

    firebaseApp = admin.initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID || 'lokolo-platform',
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
};

export const getAuth = (): admin.auth.Auth => {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.auth(firebaseApp);
};

export const verifyIdToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
};
