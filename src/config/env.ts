const read = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value || undefined;
};

export const publicEnv = {
  appUrl: read("NEXT_PUBLIC_APP_URL"),
  appwriteEndpoint: read("NEXT_PUBLIC_APPWRITE_ENDPOINT"),
  appwriteProjectId: read("NEXT_PUBLIC_APPWRITE_PROJECT_ID"),
};

export const serverEnv = {
  databaseUrl: read("DATABASE_URL"),
  appwriteApiKey: read("APPWRITE_API_KEY"),
  databaseId: read("APPWRITE_DATABASE_ID"),
  legislationCollectionId: read("APPWRITE_LEGISLATION_COLLECTION_ID"),
  legislatorsCollectionId: read("APPWRITE_LEGISLATORS_COLLECTION_ID"),
  storageBucketId: read("APPWRITE_STORAGE_BUCKET_ID"),
};

export const isAppwriteConfigured = Boolean(
  publicEnv.appwriteEndpoint && publicEnv.appwriteProjectId,
);

export function requirePublicAppwriteEnv() {
  if (!publicEnv.appwriteEndpoint || !publicEnv.appwriteProjectId) {
    throw new Error(
      "Appwrite is not configured. Set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID.",
    );
  }

  return {
    endpoint: publicEnv.appwriteEndpoint,
    projectId: publicEnv.appwriteProjectId,
  };
}
