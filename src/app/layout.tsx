import type { Metadata } from "next";
import AuthProvider from "@/components/providers/AuthProvider";
import { PushNotificationClient } from "@/components/PushNotificationClient";
import "./globals.css";

export const metadata: Metadata = {
    title: "نظام التموين | مديرية التموين والتجارة الداخلية - D.S.I.T",
    description: "نظام إدارة ومراقبة وتوزيع المخصصات الحكومية للمواطنين - مديرية التموين والتجارة الداخلية في السويداء",
    keywords: ["تموين", "مخصصات", "توزيع", "محروقات", "دفتر عائلة", "DSIT"],
    authors: [{ name: "مديرية التموين والتجارة الداخلية" }],
    icons: {
        icon: "/logo.jpeg",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl">
            <body>
                <AuthProvider>
                    <PushNotificationClient />
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
