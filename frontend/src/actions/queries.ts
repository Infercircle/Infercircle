import { db } from "@/lib/db";

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
