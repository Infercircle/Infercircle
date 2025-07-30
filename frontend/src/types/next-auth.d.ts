import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      username?: string;
      followersCount?: number;
      twitterId?: string;
    } & DefaultSession["user"];
    accessToken?: string;
    refreshToken?: string;
  }

  interface User {
    id?: string;
    username?: string;
    followersCount?: number;
    twitterId?: string;
  }
} 