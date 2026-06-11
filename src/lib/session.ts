import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";

export async function requireAuth(roles?: Role[]) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  if (roles && !roles.includes(session.user.role)) {
    redirect("/");
  }
  return session;
}
