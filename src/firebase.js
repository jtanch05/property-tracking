import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBvZ4bk1zDQMi6D87vyoyihvCo255ia984",
    authDomain: "proptrack-3fd1d.firebaseapp.com",
    projectId: "proptrack-3fd1d",
    storageBucket: "proptrack-3fd1d.firebasestorage.app",
    messagingSenderId: "282897604644",
    appId: "1:282897604644:web:3b2b1ab470e612191878b1",
    measurementId: "G-Y1GMKRRD0S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not available in this browser');
    }
});
