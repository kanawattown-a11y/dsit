import webpush from "web-push";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// Configure VAPID
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || "mailto:admin@dsit.gov.sy",
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(userId: string, payload: NotificationPayload) {
    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
    });

    const results = await Promise.allSettled(
        subscriptions.map((sub) =>
            webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                JSON.stringify(payload)
            )
        )
    );

    // Clean up invalid subscriptions
    const failed = results
        .map((r, i) => (r.status === "rejected" ? subscriptions[i].id : null))
        .filter(Boolean);

    if (failed.length > 0) {
        await prisma.pushSubscription.deleteMany({
            where: { id: { in: failed as string[] } },
        });
    }
}

/**
 * Send push notification to all users with a specific role
 */
export async function sendPushToRole(role: UserRole, payload: NotificationPayload) {
    const subscriptions = await prisma.pushSubscription.findMany({
        where: { user: { role, status: "APPROVED" } },
        include: { user: { select: { id: true } } },
    });

    const results = await Promise.allSettled(
        subscriptions.map((sub) =>
            webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                JSON.stringify(payload)
            )
        )
    );

    const failed = results
        .map((r, i) => (r.status === "rejected" ? subscriptions[i].id : null))
        .filter(Boolean);

    if (failed.length > 0) {
        await prisma.pushSubscription.deleteMany({
            where: { id: { in: failed as string[] } },
        });
    }
}

/**
 * Send push notification to all approved users
 */
export async function sendPushToAll(payload: NotificationPayload) {
    const subscriptions = await prisma.pushSubscription.findMany({
        where: { user: { status: "APPROVED" } },
    });

    const batchSize = 100;
    for (let i = 0; i < subscriptions.length; i += batchSize) {
        const batch = subscriptions.slice(i, i + batchSize);
        const results = await Promise.allSettled(
            batch.map((sub) =>
                webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                    },
                    JSON.stringify(payload)
                )
            )
        );

        const failed = results
            .map((r, idx) => (r.status === "rejected" ? batch[idx].id : null))
            .filter(Boolean);

        if (failed.length > 0) {
            await prisma.pushSubscription.deleteMany({
                where: { id: { in: failed as string[] } },
            });
        }
    }
}
