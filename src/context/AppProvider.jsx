import React, { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { computeAlerts } from '../utils/alerts';

const AppContext = createContext(null);

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}

export function AppProvider({ children }) {
    // --- Core Data ---
    const [properties, setProperties] = useLocalStorage('properties', []);
    const [tenants, setTenants] = useLocalStorage('tenants', []);
    const [agreements, setAgreements] = useLocalStorage('agreements', []);
    const [rentRecords, setRentRecords] = useLocalStorage('rentRecords', []);
    const [taxRecords, setTaxRecords] = useLocalStorage('taxRecords', []);
    const [utilityRecords, setUtilityRecords] = useLocalStorage('utilityRecords', []);
    const [insuranceRecords, setInsuranceRecords] = useLocalStorage('insuranceRecords', []);
    const [maintenanceRecords, setMaintenanceRecords] = useLocalStorage('maintenanceRecords', []);
    const [vendors, setVendors] = useLocalStorage('vendors', []);
    const [managementFees, setManagementFees] = useLocalStorage('managementFees', []);
    const [payouts, setPayouts] = useLocalStorage('payouts', []);
    const [deposits, setDeposits] = useLocalStorage('deposits', []);

    // --- Settings ---
    const [settings, setSettings] = useLocalStorage('settings', {
        theme: 'dark',
        selectedPropertyId: null, // null = all properties
        pinEnabled: false,
        pin: null,
    });

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

    // --- CRUD Helpers ---
    function addItem(setter) {
        return (item) => setter(prev => [...prev, { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
    }

    function updateItem(setter) {
        return (id, updates) => setter(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
        ));
    }

    function deleteItem(setter) {
        return (id) => setter(prev => prev.filter(item => item.id !== id));
    }

    const value = {
        // Raw data
        properties, setProperties,
        tenants, setTenants,
        agreements, setAgreements,
        rentRecords, setRentRecords,
        taxRecords, setTaxRecords,
        utilityRecords, setUtilityRecords,
        insuranceRecords, setInsuranceRecords,
        maintenanceRecords, setMaintenanceRecords,
        vendors, setVendors,
        managementFees, setManagementFees,
        payouts, setPayouts,
        deposits, setDeposits,

        // Settings
        settings, setSettings,
        selectedProperty,

        // Filtered data
        filteredData,

        // Alerts
        alerts,

        // CRUD helpers
        addProperty: addItem(setProperties),
        updateProperty: updateItem(setProperties),
        deleteProperty: deleteItem(setProperties),

        addTenant: addItem(setTenants),
        updateTenant: updateItem(setTenants),
        deleteTenant: deleteItem(setTenants),

        addAgreement: addItem(setAgreements),
        updateAgreement: updateItem(setAgreements),
        deleteAgreement: deleteItem(setAgreements),

        addRentRecord: addItem(setRentRecords),
        updateRentRecord: updateItem(setRentRecords),
        deleteRentRecord: deleteItem(setRentRecords),

        addTaxRecord: addItem(setTaxRecords),
        updateTaxRecord: updateItem(setTaxRecords),
        deleteTaxRecord: deleteItem(setTaxRecords),

        addUtilityRecord: addItem(setUtilityRecords),
        updateUtilityRecord: updateItem(setUtilityRecords),
        deleteUtilityRecord: deleteItem(setUtilityRecords),

        addInsuranceRecord: addItem(setInsuranceRecords),
        updateInsuranceRecord: updateItem(setInsuranceRecords),
        deleteInsuranceRecord: deleteItem(setInsuranceRecords),

        addMaintenanceRecord: addItem(setMaintenanceRecords),
        updateMaintenanceRecord: updateItem(setMaintenanceRecords),
        deleteMaintenanceRecord: deleteItem(setMaintenanceRecords),

        addVendor: addItem(setVendors),
        updateVendor: updateItem(setVendors),
        deleteVendor: deleteItem(setVendors),

        addManagementFee: addItem(setManagementFees),
        updateManagementFee: updateItem(setManagementFees),
        deleteManagementFee: deleteItem(setManagementFees),

        addPayout: addItem(setPayouts),
        updatePayout: updateItem(setPayouts),
        deletePayout: deleteItem(setPayouts),

        addDeposit: addItem(setDeposits),
        updateDeposit: updateItem(setDeposits),
        deleteDeposit: deleteItem(setDeposits),
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}
