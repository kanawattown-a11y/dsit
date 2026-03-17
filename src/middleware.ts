import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = request.nextUrl;

    // Public routes
    const publicRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/api/auth"];
    const isPublicRoute = pathname === "/" || publicRoutes.some((route) => pathname.startsWith(route));

    // If not authenticated and trying to access protected route
    if (!token && !isPublicRoute) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If authenticated and trying to access auth pages
    if (token && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register"))) {
        const role = token.role as string;
        const dashboardUrl = getDashboardUrl(role);
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // Role-based route protection
    if (token) {
        const role = token.role as string;

        if (pathname.startsWith("/admin") && role !== "ADMIN") {
            return NextResponse.redirect(new URL(getDashboardUrl(role), request.url));
        }

        if (pathname.startsWith("/inspector") && role !== "INSPECTOR" && role !== "ADMIN") {
            return NextResponse.redirect(new URL(getDashboardUrl(role), request.url));
        }

        if (pathname.startsWith("/distributor") && role !== "DISTRIBUTOR" && role !== "ADMIN") {
            return NextResponse.redirect(new URL(getDashboardUrl(role), request.url));
        }

        if (pathname.startsWith("/citizen") && role !== "USER" && role !== "ADMIN") {
            return NextResponse.redirect(new URL(getDashboardUrl(role), request.url));
        }

        // Redirect root to appropriate dashboard
        if (pathname === "/") {
            return NextResponse.redirect(new URL(getDashboardUrl(role), request.url));
        }
    }

    return NextResponse.next();
}

function getDashboardUrl(role: string): string {
    switch (role) {
        case "ADMIN":
            return "/admin";
        case "INSPECTOR":
            return "/inspector";
        case "DISTRIBUTOR":
            return "/distributor";
        case "USER":
        default:
            return "/citizen";
    }
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|logo|sw.js|api/auth).*)",
    ],
};
