import { SessionOptions } from "iron-session";

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  isLoggedIn: boolean;
}

const ONE_DAY = 60 * 60 * 24;

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "binawf-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: ONE_DAY * 7, // 1 week
    sameSite: "lax",
  },
  ttl: ONE_DAY * 7,
};
