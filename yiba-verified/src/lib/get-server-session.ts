// Helper to get server session
import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getServerSession() {
  return nextAuthGetServerSession(authOptions);
}
