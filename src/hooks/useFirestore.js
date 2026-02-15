import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, doc, onSnapshot, writeBatch, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthProvider';

/**
 * Custom hook that syncs a Firestore subcollection under users/{uid}/{collectionName}.
 * Provides the same [data, setData] interface as useLocalStorage,
 * but backed by Firestore with real-time sync.
 */
export function useFirestore(collectionName) {
    const { user } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const isFirstLoad = useRef(true);

    // Real-time listener
    useEffect(() => {
        if (!user) {
            setData([]);
            setLoading(false);
            return;
        }

        const colRef = collection(db, 'users', user.uid, collectionName);
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setData(items);
            if (isFirstLoad.current) {
                isFirstLoad.current = false;
                setLoading(false);
            }
        }, (error) => {
            console.error(`Firestore error (${collectionName}):`, error);
            setLoading(false);
        });

        return unsubscribe;
    }, [user, collectionName]);

    // Add a single item
    const addItem = useCallback(async (item) => {
        if (!user) return;
        const id = item.id || crypto.randomUUID();
        const docRef = doc(db, 'users', user.uid, collectionName, id);
        const record = {
            ...item,
            id,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, record);
        return id;
    }, [user, collectionName]);

    // Update an item by ID
    const updateItem = useCallback(async (id, updates) => {
        if (!user) return;
        const docRef = doc(db, 'users', user.uid, collectionName, id);
        // Merge approach: read current from local state and apply updates
        const current = data.find(d => d.id === id);
        if (!current) return;
        await setDoc(docRef, { ...current, ...updates, updatedAt: new Date().toISOString() });
    }, [user, collectionName, data]);

    // Delete an item by ID
    const deleteItem = useCallback(async (id) => {
        if (!user) return;
        const docRef = doc(db, 'users', user.uid, collectionName, id);
        await deleteDoc(docRef);
    }, [user, collectionName]);

    // Bulk import (used for localStorage migration)
    const bulkImport = useCallback(async (items) => {
        if (!user || !items.length) return;
        // Firestore batches are limited to 500 ops
        const batchSize = 450;
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = items.slice(i, i + batchSize);
            for (const item of chunk) {
                const id = item.id || crypto.randomUUID();
                const docRef = doc(db, 'users', user.uid, collectionName, id);
                batch.set(docRef, { ...item, id });
            }
            await batch.commit();
        }
    }, [user, collectionName]);

    return { data, loading, addItem, updateItem, deleteItem, bulkImport };
}

/**
 * Hook for a single Firestore document (used for settings).
 * Stores at users/{uid}/settings/default
 */
export function useFirestoreDoc(docPath, initialValue) {
    const { user } = useAuth();
    const [data, setData] = useState(initialValue);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setData(initialValue);
            setLoading(false);
            return;
        }

        const docRef = doc(db, 'users', user.uid, docPath);
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                setData(snapshot.data());
            } else {
                setData(initialValue);
            }
            setLoading(false);
        }, (error) => {
            console.error(`Firestore doc error (${docPath}):`, error);
            setLoading(false);
        });

        return unsubscribe;
    }, [user, docPath]);

    const update = useCallback(async (updater) => {
        if (!user) return;
        const docRef = doc(db, 'users', user.uid, docPath);
        // Support both function updater and direct value
        const newValue = typeof updater === 'function' ? updater(data) : updater;
        setData(newValue); // Optimistic update
        await setDoc(docRef, newValue);
    }, [user, docPath, data]);

    return [data, update, loading];
}
