import type { NextRequest } from "next/server";
import { loginHandler } from "@/lib/auth";

export async function POST(request: NextRequest) {
  return loginHandler(request);
}
