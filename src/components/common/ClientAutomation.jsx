import { useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useApp } from '../../context/AppProvider';
import { db } from '../../firebase';
import { collection, doc, writeBatch, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { addDays, format } from 'date-fns';

export default function ClientAutomation() {
    const { user } = useAuth();
    const { agreements, properties, tenants } = useApp();

    useEffect(() => {
        if (!user?.uid || !agreements.length) return;

        const checkAutomations = async () => {
            try {
                // To prevent running this constantly on every page load, we check if it already ran today
                const runLogRef = doc(db, 'users', user.uid, 'profile', 'automation_log');
                const runLogSnap = await getDoc(runLogRef);

                const todayStr = format(new Date(), 'yyyy-MM-dd');

                if (runLogSnap.exists() && runLogSnap.data().lastRunDate === todayStr) {
                    console.log("Client Automation already ran today. Skipping.");
                    return;
                }

                console.log("Running Daily Client Automation Checks...");
                const batch = writeBatch(db);
                let alertsGenerated = 0;

                // 1. Check for Expiring Leases (Exactly 30 Days Out)
                const targetDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

                const expiringAgreements = agreements.filter(a => a.endDate === targetDate);

                for (const agreement of expiringAgreements) {
                    const property = properties.find(p => p.id === agreement.propertyId);
                    const tenant = tenants.find(t => t.id === agreement.tenantId);
                    const propName = property?.nickname || 'Unknown Property';
                    const tenantName = tenant?.name || 'Unknown Tenant';

                    // Generate an alert
                    const newAlertRef = doc(collection(db, 'users', user.uid, 'alerts'));
                    batch.set(newAlertRef, {
                        title: 'Lease Expiring Soon',
                        body: `The lease for ${tenantName} at ${propName} is expiring in 30 days on ${agreement.endDate}.`,
                        type: 'lease_expiry',
                        agreementId: agreement.id,
                        read: false,
                        date: serverTimestamp()
                    });
                    alertsGenerated++;
                }

                // Execute batch writes
                if (alertsGenerated > 0) {
                    await batch.commit();
                    console.log(`Generated ${alertsGenerated} new automated alerts.`);
                }

                // Update the log so it doesn't run again today
                await setDoc(runLogRef, {
                    lastRunDate: todayStr,
                    lastRunTime: serverTimestamp()
                }, { merge: true });

            } catch (error) {
                console.error("Error running Client Automation:", error);
            }
        };

        // Run the checks 5 seconds after the app mounts to not block initial render
        const timeoutId = setTimeout(() => {
            checkAutomations();
        }, 5000);

        return () => clearTimeout(timeoutId);

    }, [user, agreements, properties, tenants]);

    return null; // This is a logic-only component that renders nothing
}
