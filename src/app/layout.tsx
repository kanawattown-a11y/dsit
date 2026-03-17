import type { Metadata } from "next";
import AuthProvider from "@/components/providers/AuthProvider";
import { PushNotificationClient } from "@/components/PushNotificationClient";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
    subsets: ["arabic", "latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-ibm-plex",
    display: "swap",
});

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
        <html lang="ar" dir="rtl" className={ibmPlexSansArabic.variable}>
            <body>
                <AuthProvider>
                    <PushNotificationClient />
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
