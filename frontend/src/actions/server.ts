"use server";
import { db } from "@/lib/db";

export async function updateUserFollowersCount(userId: string, followersCount: number) {
  return db.user.update({
    where: { id: userId },
    data: { followersCount },
  });
}

export async function updateUserImageInDB(image: string, userId: string) {
  return db.user.update({
    where: { id: userId },
    data: {
      image: image
    }
  });
}