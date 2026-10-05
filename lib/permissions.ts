import { redirect } from "next/navigation";
import { requireAuth } from "./auth";

/** Gate for admin-only screens and actions — enforced server-side. */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    redirect("/admin");
  }
  return session;
}
