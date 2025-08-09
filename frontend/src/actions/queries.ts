import { db } from "@/lib/db";
import { nanoid } from "nanoid";

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
  });
}

export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
  });
}

export async function getUserByUsername(username: string) {
    return db.user.findUnique({
        where: { username },
    });
}

export async function findInviteCode(code: string) {
  return db.inviteCode.findUnique({
    where: { InviteCode: code },
  });
}

export async function updateInviteCode(code: string, used: boolean) {
  return db.inviteCode.update({
    where: { InviteCode: code },
    data: { used },
  });
}

export async function updateUserInvite(id: string, inviteAccepted: boolean) {
  return db.user.update({
    where: { id },
    data: {
      inviteAccepted,
      updatedAt: new Date(),
    },
  });
}

export async function getAllAssetSentimentScores() {
  return db.assetSentiMentScore.findMany();
}

export async function generateInviteCode(email?: string | null, username?: string | null) {
  // Generate a unique invite code using nanoid
  const code = nanoid(12).toUpperCase();
  
  return db.inviteCode.create({
    data: {
      InviteCode: code,
      email,
      username,
      used: false,
    },
  });
}

export async function getAllInviteCodes() {
  return db.inviteCode.findMany({
    orderBy: {
      InviteCode: 'desc'
    }
  });
}

export async function getEliteUsers() {
  return db.eliteCurator.findMany();
}
