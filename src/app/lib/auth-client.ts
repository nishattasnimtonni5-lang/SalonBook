import { createAuthClient } from "better-auth/react"
import { API_BASE_URL } from "@/app/lib/api/config"

export const authClient = createAuthClient({
    
    baseURL: "https://salon-book-server-six.vercel.app",
      
})
export const signIn = async () => {
  const data = await authClient.signIn.social({
    provider: "google",
    callbackURL: "https://salon-book-a-06.vercel.app",
  });
};
