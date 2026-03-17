import admin from "firebase-admin";

// Initialise only once (singleton for Next.js HMR)
if (!admin.apps.length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
    } else {
        console.warn("[Firebase Admin] Missing environment variables. FCM disabled.");
    }
}

export const fcmAdmin = admin.apps.length ? admin.messaging() : null;
export default admin;
