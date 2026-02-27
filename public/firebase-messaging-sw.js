importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBvZ4bk1zDQMi6D87vyoyihvCo255ia984",
    authDomain: "proptrack-3fd1d.firebaseapp.com",
    projectId: "proptrack-3fd1d",
    storageBucket: "proptrack-3fd1d.firebasestorage.app",
    messagingSenderId: "282897604644",
    appId: "1:282897604644:web:3b2b1ab470e612191878b1",
    measurementId: "G-Y1GMKRRD0S"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/vite.svg',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
