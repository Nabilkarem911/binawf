import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { unsealData, sealData, getIronSession, webCookies } from "iron-session";
import { AdminSession, sessionOptions } from "./session";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookie = (await cookies()).get(sessionOptions.cookieName)?.value;
  if (!cookie) return null;

  try {
    const session = await unsealData<AdminSession>(cookie, {
      password: sessionOptions.password,
    });
    return session && session.isLoggedIn ? session : null;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export async function verifyCredentials(email: string, password: string): Promise<AdminSession | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isLoggedIn: true,
  };
}

export async function createSessionCookie(session: AdminSession): Promise<string> {
  return sealData(session, { password: sessionOptions.password, ttl: sessionOptions.ttl });
}

export async function loginHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const session = await verifyCredentials(email, password);
    if (!session) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const headers = new Headers();
    const jar = webCookies(request, headers);
    const ironSession = await getIronSession<AdminSession>(jar, sessionOptions);
    Object.assign(ironSession, session);
    await ironSession.save();

    return NextResponse.json({ ok: true, user: { name: session.name, role: session.role } }, { headers });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function logoutHandler(request: NextRequest) {
  const headers = new Headers();
  const jar = webCookies(request, headers);
  const session = await getIronSession<AdminSession>(jar, sessionOptions);
  session.destroy();
  return NextResponse.json({ ok: true }, { headers });
}
