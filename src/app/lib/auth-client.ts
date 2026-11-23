

import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: "https://salon-book-server-six.vercel.app",
  fetchOptions: {
    credentials: "include",
  },
})

export const signIn = async () => {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "https://salon-book-a-06.vercel.app",
  })
}