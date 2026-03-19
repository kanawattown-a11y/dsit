import type { Metadata } from "next";
import AuthProvider from "@/components/providers/AuthProvider";
import { PushNotificationClient } from "@/components/PushNotificationClient";
import { Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

const notoKufiArabic = Noto_Kufi_Arabic({
    subsets: ["arabic"],
    variable: "--font-noto-kufi",
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
        <html lang="ar" dir="rtl" className={notoKufiArabic.variable}>
            <body>
                <AuthProvider>
                    <PushNotificationClient />
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
