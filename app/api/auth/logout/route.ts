import type { NextRequest } from "next/server";
import { logoutHandler } from "@/lib/auth";

export async function POST(request: NextRequest) {
  return logoutHandler(request);
}
