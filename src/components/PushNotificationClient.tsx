"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
    if (!firebaseConfig.apiKey) return null;
    return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

export function PushNotificationClient() {
    const { data: session } = useSession();

    useEffect(() => {
        if (!session || typeof window === "undefined") return;
        if (!firebaseConfig.apiKey) {
            console.warn("[FCM] Firebase config missing. Push disabled.");
            return;
        }

        const registerFCM = async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    console.warn("[FCM] Notification permission denied.");
                    return;
                }

                const app = getFirebaseApp();
                if (!app) return;

                const messaging = getMessaging(app);

                // Register our custom Firebase Messaging SW
                const registration = await navigator.serviceWorker.register(
                    "/firebase-messaging-sw.js"
                );

                const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
                const fcmToken = await getToken(messaging, {
                    vapidKey,
                    serviceWorkerRegistration: registration,
                });

                if (!fcmToken) {
                    console.warn("[FCM] Could not obtain FCM token.");
                    return;
                }

                // Save token to server
                await fetch("/api/notifications/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fcmToken }),
                });

                // Handle foreground messages
                onMessage(messaging, (payload) => {
                    console.log("[FCM] Foreground message:", payload);
                    if (payload.notification?.title) {
                        new Notification(payload.notification.title, {
                            body: payload.notification.body,
                            icon: "/logo.jpeg",
                            dir: "rtl",
                            lang: "ar",
                        });
                    }
                });
            } catch (err) {
                console.warn("[FCM] Registration failed:", err);
            }
        };

        registerFCM();
    }, [session]);

    return null;
}
