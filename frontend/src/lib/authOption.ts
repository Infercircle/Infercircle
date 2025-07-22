import { db } from "./db";
import { getServerSession, NextAuthOptions } from "next-auth";
import Twitter from "next-auth/providers/twitter";
import Google from "next-auth/providers/google";
import { User } from "./types";

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
      if (session.user && token.sub) {
        session.user.id = token.sub;
        
        // Fetch the latest user data from the database
        const dbUser = (session.user.email && session.user.email.length > 0) ? await db.user.findFirst({
          where: { email: session.user.email }
        }) : await db.user.findFirst({
          where: { username: token.username as string }
        });
        
        if (dbUser) {
          // Use the database values for name and other fields
          return {
            ...session,
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
                    user: dbUser as User
          }
        }
      }
      return {
        ...session,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
                user: {
          ...session.user,
          username: token.username,
          followersCount: token.followersCount,
        } as User
      }
    },

  async signIn({ user }) {
    const account = user as User;
    if (!account.email && !account.username) {
      return false;
    }

    if(account.username && account.followersCount){
      // Get the current session
      const session = await getServerSession();
      const dbUser = session?.user as User;
      if (dbUser && dbUser.email && dbUser.email.length > 0 && dbUser.username && dbUser.username.length > 0) {
        return true;
      }
      if(session && session?.user?.email && (!dbUser.username || dbUser.username.length <= 0)) {
        await db.user.update({
          where: { email: session.user.email },
          data: {
            name: account.name || session.user.name,
            image: account.image || session.user.image || "",
            followersCount: account.followersCount,
            username: account.username,
          },
        });
        return true;
      }
    }

    try {
      // Check if user exists
      let dbUser = (account.email && account.email.length > 0) ? await db.user.findFirst({
        where: { email: account.email }
      }) : await db.user.findFirst({
        where: { username: account.username }
      });

      // If user doesn't exist, create one with only the required fields
      if (!dbUser) {
        dbUser = await db.user.create({
          data: {
            id: account.id,
            email: account.email,
            name: account.name,
            image: account.image || user.image || "",
            followersCount: account.followersCount,
            username: account.username,
          },
        });
      }
      return true;
    } catch (error) {
      console.error("Error during sign in:", error);
      return false;
    }
  },
},
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
  },
}