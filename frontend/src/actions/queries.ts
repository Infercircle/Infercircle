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