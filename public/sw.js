/* eslint-disable no-restricted-globals */
self.addEventListener("push", function (event) {
    const data = event.data ? event.data.json() : {};

    const options = {
        body: data.body || "لديك إشعار جديد",
        icon: "/logo-192.png",
        badge: "/logo-72.png",
        dir: "rtl",
        lang: "ar",
        vibrate: [200, 100, 200],
        data: {
            url: data.url || "/",
        },
        actions: [
            { action: "open", title: "فتح" },
            { action: "close", title: "إغلاق" },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || "نظام التموين", options)
    );
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    if (event.action === "close") return;

    const url = event.notification.data?.url || "/";
    event.waitUntil(
        self.clients.matchAll({ type: "window" }).then(function (clientList) {
            for (const client of clientList) {
                if (client.url === url && "focus" in client) {
                    return client.focus();
                }
            }
            return self.clients.openWindow(url);
        })
    );
});
