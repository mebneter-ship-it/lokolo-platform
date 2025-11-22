import { Storage } from '@google-cloud/storage';
import path from 'path';

let storage: Storage | null = null;

export const initializeStorage = (): Storage => {
  if (storage) {
    return storage;
  }

  try {
    // Use service account key file if provided
    const keyFilePath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    
    if (keyFilePath) {
      // Resolve relative path from backend root
      const resolvedPath = path.resolve(process.cwd(), keyFilePath);
      
      storage = new Storage({
        projectId: process.env.FIREBASE_PROJECT_ID || 'lokolo-platform',
        keyFilename: resolvedPath,
      });
      
      console.log('✅ Cloud Storage initialized with service account key');
    } else {
      // Fallback to default credentials (for Cloud Run deployment)
      storage = new Storage({
        projectId: process.env.FIREBASE_PROJECT_ID || 'lokolo-platform',
      });
      
      console.log('✅ Cloud Storage initialized with default credentials');
    }

    return storage;
  } catch (error) {
    console.error('❌ Failed to initialize Cloud Storage:', error);
    throw error;
  }
};

export const getStorage = (): Storage => {
  if (!storage) {
    throw new Error('Storage not initialized. Call initializeStorage() first.');
  }
  return storage;
};

export const getBucket = () => {
  const bucketName = process.env.GCS_BUCKET_NAME || 'lokolo-platform-media';
  return getStorage().bucket(bucketName);
};
