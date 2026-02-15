// Malaysian states and federal territories
export const MALAYSIA_STATES = [
    { code: 'JHR', name: 'Johor' },
    { code: 'KDH', name: 'Kedah' },
    { code: 'KTN', name: 'Kelantan' },
    { code: 'MLK', name: 'Melaka' },
    { code: 'NSN', name: 'Negeri Sembilan' },
    { code: 'PHG', name: 'Pahang' },
    { code: 'PRK', name: 'Perak' },
    { code: 'PLS', name: 'Perlis' },
    { code: 'PNG', name: 'Pulau Pinang' },
    { code: 'SBH', name: 'Sabah' },
    { code: 'SWK', name: 'Sarawak' },
    { code: 'SGR', name: 'Selangor' },
    { code: 'TRG', name: 'Terengganu' },
    { code: 'KUL', name: 'W.P. Kuala Lumpur' },
    { code: 'PJY', name: 'W.P. Putrajaya' },
    { code: 'LBN', name: 'W.P. Labuan' },
];

export const PROPERTY_TYPES = [
    { value: 'condo', label: 'Condominium / Apartment' },
    { value: 'landed_terrace', label: 'Terrace / Link House' },
    { value: 'landed_semi', label: 'Semi-Detached' },
    { value: 'landed_bungalow', label: 'Bungalow' },
    { value: 'landed_townhouse', label: 'Townhouse' },
    { value: 'shoplot', label: 'Shoplot / Commercial' },
    { value: 'studio', label: 'Studio / SoHo' },
    { value: 'other', label: 'Other' },
];

export const AGREEMENT_TYPES = [
    { value: '6_months', label: '6 Months' },
    { value: '1_year', label: '1 Year' },
    { value: '2_years', label: '2 Years' },
    { value: '3_years', label: '3 Years' },
    { value: 'custom', label: 'Custom' },
];

export const PAYMENT_METHODS = [
    { value: 'transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'ewallet', label: 'E-Wallet (TnG / DuitNow)' },
    { value: 'other', label: 'Other' },
];

export const INSURANCE_TYPES = [
    { value: 'fire', label: 'Fire Insurance' },
    { value: 'houseowner', label: 'Houseowner Insurance' },
    { value: 'landlord', label: 'Landlord Insurance' },
    { value: 'content', label: 'Content Insurance' },
    { value: 'other', label: 'Other' },
];

export const MAINTENANCE_TYPES = [
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'aircon', label: 'Air-Conditioning' },
    { value: 'pest_control', label: 'Pest Control' },
    { value: 'painting', label: 'Painting' },
    { value: 'waterproofing', label: 'Waterproofing' },
    { value: 'appliance', label: 'Appliance Repair' },
    { value: 'locksmith', label: 'Locksmith' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'renovation', label: 'Renovation' },
    { value: 'other', label: 'Other' },
];

export const UTILITY_TYPES = [
    { value: 'tnb', label: 'TNB (Electricity)' },
    { value: 'water', label: 'Water (Air)' },
    { value: 'indah_water', label: 'Indah Water (Sewage)' },
    { value: 'internet', label: 'Internet / WiFi' },
    { value: 'gas', label: 'Gas' },
    { value: 'other', label: 'Other' },
];

export const VENDOR_SERVICE_TYPES = [
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'aircon', label: 'Air-Conditioning' },
    { value: 'pest_control', label: 'Pest Control' },
    { value: 'painting', label: 'Painting' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'renovation', label: 'Renovation' },
    { value: 'locksmith', label: 'Locksmith' },
    { value: 'general', label: 'General Handyman' },
    { value: 'other', label: 'Other' },
];

export const MANAGEMENT_FEE_TYPES = [
    { value: 'condo_maintenance', label: 'Condo Maintenance Fee' },
    { value: 'sinking_fund', label: 'Sinking Fund' },
    { value: 'agent_fee', label: 'Property Agent Fee' },
    { value: 'wifi', label: 'WiFi / Internet (Landlord-Paid)' },
    { value: 'cleaning', label: 'Cleaning Service' },
    { value: 'security', label: 'Security / Guard' },
    { value: 'other', label: 'Other' },
];

export const FEE_FREQUENCIES = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'one_time', label: 'One-Time' },
];
