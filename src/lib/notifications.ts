import webpush from "web-push";
import prisma from "./prisma";

// Ensure VAPID keys are set, or it will throw
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        "mailto:admin@As-Suwayda-dsit.gov",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function sendPushNotification(userId: string, payload: { title: string; body: string; url?: string }) {
    if (!process.env.VAPID_PUBLIC_KEY) {
        console.warn("[Push] VAPID keys not configured. Skipping push notification.");
        return;
    }

    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        });

        if (subscriptions.length === 0) return;

        const pushPayload = JSON.stringify(payload);

        await Promise.allSettled(
            subscriptions.map(async (sub) => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                };

                try {
                    await webpush.sendNotification(pushSubscription, pushPayload);
                } catch (err: any) {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription has unsubscribed or expired. Delete it.
                        await prisma.pushSubscription.delete({ where: { id: sub.id } });
                    } else {
                        console.error("[Push] Error sending notification:", err);
                    }
                }
            })
        );
    } catch (error) {
        console.error("[Push] Global error:", error);
    }
}
