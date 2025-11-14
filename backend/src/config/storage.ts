import { Storage } from '@google-cloud/storage';

let storage: Storage | null = null;

export const initializeStorage = (): Storage => {
  if (storage) {
    return storage;
  }

  try {
    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    });

    console.log('✅ Cloud Storage initialized successfully');
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
  const bucketName = process.env.STORAGE_BUCKET;
  if (!bucketName) {
    throw new Error('STORAGE_BUCKET environment variable is not set');
  }
  return getStorage().bucket(bucketName);
};
