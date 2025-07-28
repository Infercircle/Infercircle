import { NextAuthOptions } from "next-auth";
import Twitter from "next-auth/providers/twitter";
import Google from "next-auth/providers/google";
import { getServerSession } from "next-auth";
import { db } from "./db";
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
        token.id = (user as any).id
      }
      
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and refresh_token from a provider.
      if (session.user && token.sub) {
        session.user.id = token.sub;
        
        // Fetch the latest user data from the database
        let dbUser = null;
        
        // Try to find user by email first (for Google users)
        if (session.user.email && session.user.email.length > 0) {
          dbUser = await db.user.findFirst({
            where: { email: session.user.email }
          });
        }
        
        // If not found by email, try username (for Twitter users)
        if (!dbUser && token.username) {
          dbUser = await db.user.findFirst({
            where: { username: token.username as string }
          });
        }
        
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
      
      // For Google OAuth, we need at least an email
      // For Twitter OAuth, we need at least a username
      if (!account.email && !account.username) {
        console.log('No email or username provided');
        return false;
      }

      try {
        // Check if user exists by email first (if available)
        let dbUser = null;
        
        if (account.email && account.email.length > 0) {
          dbUser = await db.user.findFirst({
            where: { email: account.email }
          });
        }
        
        // If not found by email, check by username (for Twitter users)
        if (!dbUser && account.username && account.username.length > 0) {
          dbUser = await db.user.findFirst({
            where: { username: account.username }
          });
        }

        // If user exists, update their information
        if (dbUser) {
          await db.user.update({
            where: { id: dbUser.id },
            data: {
              name: account.name || dbUser.name,
              image: account.image || dbUser.image || "",
              followersCount: account.followersCount || dbUser.followersCount,
              username: account.username || dbUser.username,
              email: account.email || dbUser.email,
            },
          });
        } else {
          // If user doesn't exist, create one
          // For Google users, email is required but username is optional
          // For Twitter users, username is required
          if (account.email && account.email.length > 0) {
            // Google user - create with email only
            await db.user.create({
              data: {
                id: account.id,
                email: account.email,
                name: account.name,
                image: account.image || "",
                followersCount: account.followersCount,
                username: account.username, // This will be null for Google users initially
              },
            });
          } else if (account.username && account.username.length > 0) {
            // Twitter user - create with username
            await db.user.create({
              data: {
                id: account.id,
                email: account.email,
                name: account.name,
                image: account.image || "",
                followersCount: account.followersCount,
                username: account.username,
              },
            });
          } else {
            console.log('Cannot create user without email or username');
            return false;
          }
        }
        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        
        // If there's a unique constraint error, try to find and update the existing user
        if (error instanceof Error && error.message.includes('Unique constraint failed')) {
          try {
            // Try to find existing user by email or username and update them
            if (account.email && account.email.length > 0) {
              const existingUser = await db.user.findFirst({
                where: { email: account.email }
              });
              
              if (existingUser) {
                await db.user.update({
                  where: { id: existingUser.id },
                  data: {
                    name: account.name || existingUser.name,
                    image: account.image || existingUser.image || "",
                    followersCount: account.followersCount || existingUser.followersCount,
                    username: account.username || existingUser.username,
                  },
                });
                return true;
              }
            }
            
            // If not found by email, try username
            if (account.username && account.username.length > 0) {
              const existingUser = await db.user.findFirst({
                where: { username: account.username }
              });
              
              if (existingUser) {
                await db.user.update({
                  where: { id: existingUser.id },
                  data: {
                    name: account.name || existingUser.name,
                    image: account.image || existingUser.image || "",
                    followersCount: account.followersCount || existingUser.followersCount,
                    email: account.email || existingUser.email,
                  },
                });
                return true;
              }
            }
          } catch (updateError) {
            console.error("Error updating existing user:", updateError);
          }
        }
        
        return false;
      }
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: "jwt",
  }
}