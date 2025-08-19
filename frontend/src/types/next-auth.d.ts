import NextAuth, { DefaultSession } from "next-auth";
import { User as prismaUser } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: prismaUser;
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