import { useState, useEffect } from 'react';
import { messaging, db } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthProvider';

export function useNotifications() {
    const { user } = useAuth();
    const [permissionStatus, setPermissionStatus] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const [fcmToken, setFcmToken] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // VAPID Key used for generating the FCM token
    // In a real app, you should securely store from your Firebase Console => Cloud Messaging => Web configuration
    const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;


    useEffect(() => {
        if (!user || permissionStatus !== 'granted') return;

        // Initialize Realtime Listener for Foreground Messages
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log("Foreground Message received:", payload);

            const newNotification = {
                id: payload.messageId || new Date().getTime().toString(),
                title: payload.notification?.title || 'New Notification',
                body: payload.notification?.body || '',
                date: new Date().toISOString(),
                read: false,
                data: payload.data || {}
            };

            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show a browser notification even in foreground if allowed
            if (Notification.permission === 'granted') {
                new Notification(newNotification.title, { body: newNotification.body });
            }
        });

        return () => unsubscribe();
    }, [user, permissionStatus]);

    const requestPermission = async () => {
        try {
            if (!user) {
                console.warn("User must be logged in to request notification permissions.");
                return false;
            }

            console.log("Requesting notification permission...");
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission === 'granted') {
                console.log("Notification permission granted.");

                // Get the FCM Token
                const token = await getToken(messaging, { vapidKey: VAPID_KEY });

                if (token) {
                    setFcmToken(token);
                    await saveTokenToFirestore(user.uid, token);
                    return true;
                } else {
                    console.log("No registration token available. Request permission to generate one.");
                    return false;
                }
            } else {
                console.log("Unable to get permission to notify.");
                return false;
            }
        } catch (error) {
            console.error("An error occurred while requesting permission", error);
            return false;
        }
    };

    const saveTokenToFirestore = async (userId, token) => {
        try {
            const userProfileRef = doc(db, 'users', userId, 'profile', 'notifications');

            // Check if token already exists to prevent unnecessary writes
            const docSnap = await getDoc(userProfileRef);

            if (!docSnap.exists() || docSnap.data().fcmToken !== token) {
                await setDoc(userProfileRef, {
                    fcmToken: token,
                    updatedAt: serverTimestamp(),
                    deviceType: navigator.userAgent
                }, { merge: true });
                console.log("FCM Token saved to Firestore for user:", userId);
            }
        } catch (error) {
            console.error("Error saving FCM token to Firestore:", error);
        }
    };

    const markAsRead = async (notificationId) => {
        if (!user) return;
        try {
            const batch = writeBatch(db);
            const alertRef = doc(db, 'users', user.uid, 'alerts', notificationId);
            batch.update(alertRef, { read: true });
            await batch.commit();
        } catch (e) {
            console.error("Error marking alert as read:", e);
        }
    };

    const markAllAsRead = async () => {
        if (!user || unreadCount === 0) return;
        try {
            const batch = writeBatch(db);
            notifications.filter(n => !n.read).forEach(n => {
                const alertRef = doc(db, 'users', user.uid, 'alerts', n.id);
                batch.update(alertRef, { read: true });
            });
            await batch.commit();
        } catch (e) {
            console.error("Error marking all alerts as read:", e);
        }
    };

    const clearNotifications = async () => {
        if (!user || notifications.length === 0) return;
        try {
            const batch = writeBatch(db);
            notifications.forEach(n => {
                const alertRef = doc(db, 'users', user.uid, 'alerts', n.id);
                batch.delete(alertRef);
            });
            await batch.commit();
        } catch (e) {
            console.error("Error clearing alerts:", e);
        }
    };

    return {
        permissionStatus,
        requestPermission,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications
    };
}
