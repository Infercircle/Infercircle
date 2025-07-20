import { NextAuthOptions } from "next-auth";
import Twitter from "next-auth/providers/twitter";

export const authOptions: NextAuthOptions = {
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      userinfo: {
        url: "https://api.twitter.com/2/users/me",
        params: {
          "user.fields": "username,profile_image_url,public_metrics"
        }
      },
      profile({ data }) {
      return {
        id: data.id,
        name: data.name,
        username: data.username,
        followersCount: data.public_metrics?.followers_count || 0,
        // NOTE: E-mail is currently unsupported by OAuth 2 Twitter.
        email: null,
        image: data.profile_image_url,
      };
    },
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      // Persist the OAuth access_token and refresh_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
            // Persist additional user fields to the token
      if (user) {
        token.username = (user as any).username
        token.followersCount = (user as any).followersCount
      }
      
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and refresh_token from a provider.
      return {
        ...session,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
                user: {
          ...session.user,
          username: token.username,
          followersCount: token.followersCount,
        }
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
  }
}