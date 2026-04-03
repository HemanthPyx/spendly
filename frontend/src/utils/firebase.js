// Firebase configuration and push notification utilities
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import api from '../api/axios';

// Firebase config — replace with your actual values from Firebase Console
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

let app = null;
let messaging = null;

try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
} catch (error) {
    console.warn('Firebase initialization failed:', error.message);
}

/**
 * Request notification permission and register the FCM token with backend.
 * Call this after the user logs in.
 */
export const requestNotificationPermission = async () => {
    if (!messaging) {
        console.warn('Firebase messaging not initialized');
        return null;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

            const token = await getToken(messaging, {
                vapidKey,
                serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
            });

            if (token) {
                // Register with backend
                await api.post('/fcm-devices/', {
                    token,
                    device_name: getBrowserName(),
                });
                console.log('FCM token registered:', token.substring(0, 20) + '...');
                return token;
            }
        } else {
            console.log('Notification permission denied');
        }
    } catch (error) {
        console.error('Error getting notification permission:', error);
    }

    return null;
};

/**
 * Listen for foreground messages and show a toast.
 */
export const onForegroundMessage = (callback) => {
    if (!messaging) return;

    return onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        callback(payload);
    });
};

/**
 * Get a user-friendly browser name for device registration.
 */
function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    return 'Unknown Browser';
}

export { messaging };
