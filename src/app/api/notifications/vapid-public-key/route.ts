import { NextResponse } from "next/server";

export async function GET() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;

    if (!publicKey) {
        return NextResponse.json({ error: "VAPID key not configured" }, { status: 501 });
    }

    return NextResponse.json({ publicKey });
}
