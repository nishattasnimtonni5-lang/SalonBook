import { createAuthClient } from "better-auth/react"
import { API_BASE_URL } from "@/app/lib/api/config"

export const authClient = createAuthClient({
    /**
     * Backend origin. `basePath` is intentionally left unset so better-auth's
     * default `/api/auth` is preserved — requests go to
     * `{baseURL}/api/auth/*`, which Express serves via `toNodeHandler(auth)`.
     * In development this resolves to http://localhost:8000, in production to
     * the deployed backend.
     */
    baseURL: API_BASE_URL,
      
})
export const signIn = async () => {
  const data = await authClient.signIn.social({
    provider: "google",
  });
};
