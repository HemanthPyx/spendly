// Firebase Cloud Messaging Service Worker
// This file must be in the public/ directory for FCM to work

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// These values will be replaced with your actual Firebase config
firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'Expense Tracker';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'debt-reminder',
        data: payload.data,
        actions: [
            { action: 'view', title: 'View Debts' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view' || !event.action) {
        event.waitUntil(
            clients.openWindow('/debts')
        );
    }
});
