"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions } from "@/lib/session";

export async function logout() {
  (await cookies()).delete(sessionOptions.cookieName);
  redirect("/admin/login");
}
