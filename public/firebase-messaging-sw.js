// Firebase Messaging Service Worker — /public/firebase-messaging-sw.js
// Must be in the root of the public folder

importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js");

// These values are replaced at build/deploy time via environment variables.
// You can also hard-code them here since this file is public.
firebase.initializeApp({
    apiKey: self.__FIREBASE_API_KEY__ || "YOUR_API_KEY",
    authDomain: self.__FIREBASE_AUTH_DOMAIN__ || "YOUR_PROJECT.firebaseapp.com",
    projectId: self.__FIREBASE_PROJECT_ID__ || "YOUR_PROJECT_ID",
    storageBucket: self.__FIREBASE_STORAGE_BUCKET__ || "YOUR_PROJECT.appspot.com",
    messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || "YOUR_SENDER_ID",
    appId: self.__FIREBASE_APP_ID__ || "YOUR_APP_ID",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log("[FCM SW] Background message:", payload);

    const notificationTitle = payload.notification?.title || "نظام التموين";
    const notificationOptions = {
        body: payload.notification?.body || "لديك إشعار جديد",
        icon: "/logo.jpeg",
        badge: "/logo.jpeg",
        dir: "rtl",
        lang: "ar",
        vibrate: [200, 100, 200],
        data: {
            url: payload.data?.url || "/",
        },
        actions: [
            { action: "open", title: "فتح" },
            { action: "close", title: "إغلاق" },
        ],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if (event.action === "close") return;

    const url = event.notification.data?.url || "/";
    event.waitUntil(
        self.clients.matchAll({ type: "window" }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === url && "focus" in client) {
                    return client.focus();
                }
            }
            return self.clients.openWindow(url);
        })
    );
});
