import React, { createContext, useContext, useMemo, useEffect, useState, useCallback } from 'react';
import { useFirestore, useFirestoreDoc } from '../hooks/useFirestore';
import { useAuth } from './AuthProvider';
import { computeAlerts } from '../utils/alerts';
import { getStorageItem, clearAllStorage } from '../utils/storage';

const AppContext = createContext(null);

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}

// Keys that map to Firestore collections (and localStorage keys for migration)
const COLLECTION_KEYS = [
    'properties', 'tenants', 'agreements', 'rentRecords', 'taxRecords',
    'utilityRecords', 'insuranceRecords', 'maintenanceRecords',
    'vendors', 'managementFees', 'payouts', 'deposits'
];

export function AppProvider({ children }) {
    const { user } = useAuth();
    const [migrated, setMigrated] = useState(false);
    const [migrating, setMigrating] = useState(false);

    // --- Firestore Collections ---
    const propertiesStore = useFirestore('properties');
    const tenantsStore = useFirestore('tenants');
    const agreementsStore = useFirestore('agreements');
    const rentRecordsStore = useFirestore('rentRecords');
    const taxRecordsStore = useFirestore('taxRecords');
    const utilityRecordsStore = useFirestore('utilityRecords');
    const insuranceRecordsStore = useFirestore('insuranceRecords');
    const maintenanceRecordsStore = useFirestore('maintenanceRecords');
    const vendorsStore = useFirestore('vendors');
    const managementFeesStore = useFirestore('managementFees');
    const payoutsStore = useFirestore('payouts');
    const depositsStore = useFirestore('deposits');

    // Map for easy lookup
    const stores = {
        properties: propertiesStore,
        tenants: tenantsStore,
        agreements: agreementsStore,
        rentRecords: rentRecordsStore,
        taxRecords: taxRecordsStore,
        utilityRecords: utilityRecordsStore,
        insuranceRecords: insuranceRecordsStore,
        maintenanceRecords: maintenanceRecordsStore,
        vendors: vendorsStore,
        managementFees: managementFeesStore,
        payouts: payoutsStore,
        deposits: depositsStore,
    };

    // --- Settings (single document) ---
    const [settings, setSettings, settingsLoading] = useFirestoreDoc('settings/default', {
        theme: 'dark',
        selectedPropertyId: null,
        pinEnabled: false,
        pin: null,
    });

    // --- One-time Migration from localStorage to Firestore ---
    useEffect(() => {
        if (!user || migrated || migrating) return;

        // Check if there's any localStorage data to migrate
        let hasLocalData = false;
        for (const key of COLLECTION_KEYS) {
            const local = getStorageItem(key);
            if (local && Array.isArray(local) && local.length > 0) {
                hasLocalData = true;
                break;
            }
        }

        if (!hasLocalData) {
            setMigrated(true);
            return;
        }

        // Migrate
        async function migrate() {
            setMigrating(true);
            console.log('Migrating localStorage data to Firestore...');
            try {
                for (const key of COLLECTION_KEYS) {
                    const localData = getStorageItem(key);
                    if (localData && Array.isArray(localData) && localData.length > 0) {
                        await stores[key].bulkImport(localData);
                        console.log(`  Migrated ${localData.length} ${key} records`);
                    }
                }

                // Migrate settings
                const localSettings = getStorageItem('settings');
                if (localSettings && typeof localSettings === 'object') {
                    await setSettings(localSettings);
                    console.log('  Migrated settings');
                }

                // Clear localStorage after successful migration
                clearAllStorage();
                console.log('Migration complete! localStorage cleared.');
            } catch (err) {
                console.error('Migration failed:', err);
            } finally {
                setMigrated(true);
                setMigrating(false);
            }
        }

        migrate();
    }, [user, migrated, migrating]);

    // --- Loading state ---
    const dataLoading = Object.values(stores).some(s => s.loading) || settingsLoading;

    // --- Shorthand data refs ---
    const properties = propertiesStore.data;
    const tenants = tenantsStore.data;
    const agreements = agreementsStore.data;
    const rentRecords = rentRecordsStore.data;
    const taxRecords = taxRecordsStore.data;
    const utilityRecords = utilityRecordsStore.data;
    const insuranceRecords = insuranceRecordsStore.data;
    const maintenanceRecords = maintenanceRecordsStore.data;
    const vendors = vendorsStore.data;
    const managementFees = managementFeesStore.data;
    const payouts = payoutsStore.data;
    const deposits = depositsStore.data;

    // --- Active Property Filter ---
    const selectedProperty = useMemo(() => {
        if (!settings.selectedPropertyId) return null;
        return properties.find(p => p.id === settings.selectedPropertyId) || null;
    }, [settings.selectedPropertyId, properties]);

    // --- Filtered Records (by selected property) ---
    const filteredData = useMemo(() => {
        const pid = settings.selectedPropertyId;
        if (!pid) {
            return { tenants, agreements, rentRecords, taxRecords, utilityRecords, insuranceRecords, maintenanceRecords, managementFees, payouts, deposits };
        }
        return {
            tenants: tenants.filter(t => t.propertyId === pid),
            agreements: agreements.filter(a => a.propertyId === pid),
            rentRecords: rentRecords.filter(r => r.propertyId === pid),
            taxRecords: taxRecords.filter(t => t.propertyId === pid),
            utilityRecords: utilityRecords.filter(u => u.propertyId === pid),
            insuranceRecords: insuranceRecords.filter(i => i.propertyId === pid),
            maintenanceRecords: maintenanceRecords.filter(m => m.propertyId === pid),
            managementFees: managementFees.filter(f => f.propertyId === pid),
            payouts: payouts.filter(p => p.propertyId === pid),
            deposits: deposits.filter(d => d.propertyId === pid),
        };
    }, [settings.selectedPropertyId, tenants, agreements, rentRecords, taxRecords, utilityRecords, insuranceRecords, maintenanceRecords, managementFees, payouts, deposits]);

    // --- Alerts ---
    const alerts = useMemo(() => computeAlerts({
        agreements,
        taxRecords,
        insuranceRecords,
        maintenanceRecords,
        rentRecords,
        managementFees,
        properties,
    }), [agreements, taxRecords, insuranceRecords, maintenanceRecords, rentRecords, managementFees, properties]);

    // --- Setter wrappers that match the old useLocalStorage interface ---
    // These allow pages to call setProperties(prev => [...prev, newItem]) etc.
    const createSetter = useCallback((store) => {
        return (updater) => {
            // If it's a function (like prev => [...prev, item]), we can't easily replicate this
            // The CRUD helpers below are the primary way to modify data
            console.warn('Direct setter called — use CRUD helpers (addItem/updateItem/deleteItem) instead.');
        };
    }, []);

    const value = {
        // Data
        properties,
        tenants,
        agreements,
        rentRecords,
        taxRecords,
        utilityRecords,
        insuranceRecords,
        maintenanceRecords,
        vendors,
        managementFees,
        payouts,
        deposits,

        // Setters (kept for backward compatibility — pages may use them)
        setProperties: createSetter(propertiesStore),
        setTenants: createSetter(tenantsStore),
        setAgreements: createSetter(agreementsStore),
        setRentRecords: createSetter(rentRecordsStore),
        setTaxRecords: createSetter(taxRecordsStore),
        setUtilityRecords: createSetter(utilityRecordsStore),
        setInsuranceRecords: createSetter(insuranceRecordsStore),
        setMaintenanceRecords: createSetter(maintenanceRecordsStore),
        setVendors: createSetter(vendorsStore),
        setManagementFees: createSetter(managementFeesStore),
        setPayouts: createSetter(payoutsStore),
        setDeposits: createSetter(depositsStore),

        // Settings
        settings, setSettings,
        selectedProperty,

        // Filtered data
        filteredData,

        // Alerts
        alerts,

        // Loading
        dataLoading: dataLoading || migrating,

        // CRUD helpers
        addProperty: propertiesStore.addItem,
        updateProperty: propertiesStore.updateItem,
        deleteProperty: propertiesStore.deleteItem,

        addTenant: tenantsStore.addItem,
        updateTenant: tenantsStore.updateItem,
        deleteTenant: tenantsStore.deleteItem,

        addAgreement: agreementsStore.addItem,
        updateAgreement: agreementsStore.updateItem,
        deleteAgreement: agreementsStore.deleteItem,

        addRentRecord: rentRecordsStore.addItem,
        updateRentRecord: rentRecordsStore.updateItem,
        deleteRentRecord: rentRecordsStore.deleteItem,

        addTaxRecord: taxRecordsStore.addItem,
        updateTaxRecord: taxRecordsStore.updateItem,
        deleteTaxRecord: taxRecordsStore.deleteItem,

        addUtilityRecord: utilityRecordsStore.addItem,
        updateUtilityRecord: utilityRecordsStore.updateItem,
        deleteUtilityRecord: utilityRecordsStore.deleteItem,

        addInsuranceRecord: insuranceRecordsStore.addItem,
        updateInsuranceRecord: insuranceRecordsStore.updateItem,
        deleteInsuranceRecord: insuranceRecordsStore.deleteItem,

        addMaintenanceRecord: maintenanceRecordsStore.addItem,
        updateMaintenanceRecord: maintenanceRecordsStore.updateItem,
        deleteMaintenanceRecord: maintenanceRecordsStore.deleteItem,

        addVendor: vendorsStore.addItem,
        updateVendor: vendorsStore.updateItem,
        deleteVendor: vendorsStore.deleteItem,

        addManagementFee: managementFeesStore.addItem,
        updateManagementFee: managementFeesStore.updateItem,
        deleteManagementFee: managementFeesStore.deleteItem,

        addPayout: payoutsStore.addItem,
        updatePayout: payoutsStore.updateItem,
        deletePayout: payoutsStore.deleteItem,

        addDeposit: depositsStore.addItem,
        updateDeposit: depositsStore.updateItem,
        deleteDeposit: depositsStore.deleteItem,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}
