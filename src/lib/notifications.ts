import { fcmAdmin } from "./firebase-admin";
import prisma from "./prisma";

/**
 * Send FCM push notification to a specific user (all their devices)
 * Drop-in replacement for the old VAPID-based sendPushNotification
 */
export async function sendPushNotification(
    userId: string,
    payload: { title: string; body: string; url?: string }
) {
    if (!fcmAdmin) {
        console.warn("[FCM] Firebase Admin not initialised. Skipping push notification.");
        return;
    }

    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        });

        if (subscriptions.length === 0) return;

        const tokens = subscriptions.map((s) => s.fcmToken);

        const message = {
            tokens,
            notification: {
                title: payload.title,
                body:  payload.body,
            },
            webpush: {
                notification: {
                    icon: "/logo.jpeg",
                    dir:  "rtl",
                    lang: "ar",
                    vibrate: [200, 100, 200],
                },
                fcmOptions: {
                    link: payload.url || "/",
                },
            },
            data: {
                url: payload.url || "/",
            },
        };

        const response = await fcmAdmin.sendEachForMulticast(message as any);

        // Clean up invalid tokens
        const invalidTokens: string[] = [];
        response.responses.forEach((r, idx) => {
            const code = r.error?.code;
            if (
                code === "messaging/registration-token-not-registered" ||
                code === "messaging/invalid-registration-token"
            ) {
                invalidTokens.push(tokens[idx]);
            }
        });

        if (invalidTokens.length > 0) {
            await prisma.pushSubscription.deleteMany({
                where: { fcmToken: { in: invalidTokens } },
            });
        }
    } catch (error) {
        console.error("[FCM] Global error:", error);
    }
}
