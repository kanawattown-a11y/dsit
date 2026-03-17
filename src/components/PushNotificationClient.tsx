"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

const PUBLIC_VAPID_KEY = "BI_YOUR_PUBLIC_KEY_HERE"; // In production, move to env var or fetch from API

export function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushNotificationClient() {
    const { data: session } = useSession();

    useEffect(() => {
        if (!session || !("serviceWorker" in navigator) || !("PushManager" in window)) {
            return;
        }

        const registerPush = async () => {
            try {
                const registration = await navigator.serviceWorker.register("/sw.js");

                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    // We need a way to fetch the VAPID public key if it's dynamic, 
                    // or hardcode the public key here if it's static.
                    // For now, we assume it's set in the environment or fetched.
                    const res = await fetch("/api/notifications/vapid-public-key");
                    if (!res.ok) return; // Silent fail if not configured
                    const { publicKey } = await res.json();

                    if (!publicKey) return;

                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(publicKey),
                    });
                }

                if (subscription) {
                    await fetch("/api/notifications/subscribe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(subscription),
                    });
                }
            } catch (err) {
                console.warn("[Push] Failed to subscribe:", err);
            }
        };

        // Only ask if they haven't denied
        if (Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") registerPush();
            });
        } else if (Notification.permission === "granted") {
            registerPush();
        }

    }, [session]);

    return null; // This is a headless component globally injected
}
