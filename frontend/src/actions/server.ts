"use server";
import { db } from "@/lib/db";

export async function updateUserFollowersCount(userId: string, followersCount: number) {
  return db.user.update({
    where: { id: userId },
    data: { followersCount },
  });
}