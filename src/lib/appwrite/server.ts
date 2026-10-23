import "server-only";

import { Client, Account, Databases, Storage, Users } from "node-appwrite";
import { requirePublicAppwriteEnv, serverEnv } from "@/config/env";

export function createAdminAppwrite() {
  const { endpoint, projectId } = requirePublicAppwriteEnv();

  if (!serverEnv.appwriteApiKey) {
    throw new Error("APPWRITE_API_KEY is required for Appwrite admin operations.");
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(serverEnv.appwriteApiKey);

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
    users: new Users(client),
  };
}

export function createSessionAppwrite(sessionSecret: string) {
  const { endpoint, projectId } = requirePublicAppwriteEnv();
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setSession(sessionSecret);

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  };
}
