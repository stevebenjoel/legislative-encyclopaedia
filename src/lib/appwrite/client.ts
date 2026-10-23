import { Client, Account, Databases, Storage } from "appwrite";
import { requirePublicAppwriteEnv } from "@/config/env";

let services:
  | {
      client: Client;
      account: Account;
      databases: Databases;
      storage: Storage;
    }
  | undefined;

export function getBrowserAppwrite() {
  if (services) return services;

  const { endpoint, projectId } = requirePublicAppwriteEnv();
  const client = new Client().setEndpoint(endpoint).setProject(projectId);

  services = {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  };

  return services;
}
