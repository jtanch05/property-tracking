import { useState, useEffect, useCallback } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storage';

/**
 * Custom hook that syncs state with localStorage.
 * @param {string} key - localStorage key (auto-prefixed)
 * @param {*} initialValue - default value if key doesn't exist
 */
export function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        const stored = getStorageItem(key);
        return stored !== null ? stored : initialValue;
    });

    useEffect(() => {
        setStorageItem(key, value);
    }, [key, value]);

    const remove = useCallback(() => {
        setValue(initialValue);
        setStorageItem(key, initialValue);
    }, [key, initialValue]);

    return [value, setValue, remove];
}
