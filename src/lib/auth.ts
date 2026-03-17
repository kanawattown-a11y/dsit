import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                login: { label: "الرقم الوطني أو البريد الإلكتروني", type: "text" },
                password: { label: "كلمة المرور", type: "password" },
                ip: { label: "IP", type: "hidden" },
            },
            async authorize(credentials, req) {
                if (!credentials?.login || !credentials?.password) {
                    throw new Error("يرجى إدخال بيانات الدخول");
                }

                // ── Rate Limiting: max 5 login attempts per identifier per minute ──
                const identifier = `login:${credentials.login}`;
                const windowStart = new Date(Date.now() - 60 * 1000);

                const attemptRecord = await prisma.loginAttempt.findFirst({
                    where: { identifier, firstAt: { gte: windowStart } },
                });

                if (attemptRecord) {
                    if (attemptRecord.attempts >= 5) {
                        throw new Error("RATE_LIMITED");
                    }
                    await prisma.loginAttempt.update({
                        where: { id: attemptRecord.id },
                        data: { attempts: { increment: 1 } },
                    });
                } else {
                    await prisma.loginAttempt.create({
                        data: { identifier },
                    });
                }

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { nationalId: credentials.login },
                            { email: credentials.login },
                        ],
                    },
                });

                if (!user) {
                    throw new Error("بيانات الدخول غير صحيحة");
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
                if (!isPasswordValid) {
                    throw new Error("بيانات الدخول غير صحيحة");
                }

                if (user.status === "PENDING") {
                    throw new Error("PENDING");
                }

                if (user.status === "REJECTED") {
                    throw new Error("REJECTED");
                }

                if (user.status === "SUSPENDED") {
                    throw new Error("SUSPENDED");
                }

                return {
                    id: user.id,
                    name: user.fullName,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    nationalId: user.nationalId,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.status = (user as any).status;
                token.nationalId = (user as any).nationalId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).status = token.status;
                (session.user as any).nationalId = token.nationalId;
            }

            // ── Re-validate user status on every session check ──
            // This ensures suspended users are kicked out immediately
            try {
                const freshUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { status: true, role: true },
                });

                if (freshUser) {
                    if (freshUser.status === "SUSPENDED" || freshUser.status === "REJECTED") {
                        // Return null-like session to force sign-out
                        (session.user as any).status = freshUser.status;
                        (session.user as any).forceSignOut = true;
                    }
                    // Update role in case it was changed
                    (session.user as any).role = freshUser.role;
                }
            } catch (e) {
                // DB unreachable — continue with cached session
            }

            return session;
        },
    },
    pages: {
        signIn: "/auth/login",
        error: "/auth/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
};
