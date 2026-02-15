// Local council data by state with typical tax payment cycles
export const LOCAL_COUNCILS = {
    'Johor': [
        'Majlis Bandaraya Johor Bahru (MBJB)',
        'Majlis Bandaraya Iskandar Puteri (MBIP)',
        'Majlis Perbandaran Pasir Gudang (MPPG)',
        'Majlis Perbandaran Kulai (MPKu)',
        'Majlis Perbandaran Batu Pahat (MPBP)',
        'Majlis Perbandaran Muar (MPM)',
        'Majlis Perbandaran Kluang (MPK)',
    ],
    'Kedah': [
        'Majlis Bandaraya Alor Setar (MBAS)',
        'Majlis Perbandaran Sungai Petani (MPSPK)',
        'Majlis Perbandaran Langkawi (MPL)',
        'Majlis Perbandaran Kulim (MPKK)',
    ],
    'Kelantan': [
        'Majlis Bandaraya Kota Bharu (MPKB)',
        'Majlis Perbandaran Pasir Mas (MPPM)',
    ],
    'Melaka': [
        'Majlis Bandaraya Melaka Bersejarah (MBMB)',
        'Majlis Perbandaran Alor Gajah (MPAG)',
        'Majlis Perbandaran Jasin (MPJ)',
        'Majlis Perbandaran Hang Tuah Jaya (MPHTJ)',
    ],
    'Negeri Sembilan': [
        'Majlis Bandaraya Seremban (MBS)',
        'Majlis Perbandaran Nilai (MPN)',
        'Majlis Perbandaran Port Dickson (MPPD)',
    ],
    'Pahang': [
        'Majlis Bandaraya Kuantan (MBK)',
        'Majlis Perbandaran Temerloh (MPT)',
        'Majlis Perbandaran Bentong (MPB)',
    ],
    'Perak': [
        'Majlis Bandaraya Ipoh (MBI)',
        'Majlis Perbandaran Taiping (MPT)',
        'Majlis Perbandaran Manjung (MPM)',
        'Majlis Perbandaran Kampar (MPKp)',
    ],
    'Perlis': [
        'Majlis Bandaraya Kangar (MBKg)',
    ],
    'Pulau Pinang': [
        'Majlis Bandaraya Pulau Pinang (MBPP)',
        'Majlis Bandaraya Seberang Perai (MBSP)',
    ],
    'Sabah': [
        'Dewan Bandaraya Kota Kinabalu (DBKK)',
        'Majlis Perbandaran Sandakan (MPS)',
        'Majlis Perbandaran Tawau (MPTw)',
    ],
    'Sarawak': [
        'Dewan Bandaraya Kuching Utara (DBKU)',
        'Majlis Bandaraya Kuching Selatan (MBKS)',
        'Majlis Perbandaran Padawan (MPP)',
        'Majlis Bandaraya Miri (MBMi)',
    ],
    'Selangor': [
        'Majlis Bandaraya Petaling Jaya (MBPJ)',
        'Majlis Bandaraya Shah Alam (MBSA)',
        'Majlis Bandaraya Subang Jaya (MBSJ)',
        'Majlis Perbandaran Sepang (MPSp)',
        'Majlis Perbandaran Kajang (MPKj)',
        'Majlis Perbandaran Klang (MPK)',
        'Majlis Perbandaran Ampang Jaya (MPAJ)',
        'Majlis Perbandaran Selayang (MPS)',
    ],
    'Terengganu': [
        'Majlis Bandaraya Kuala Terengganu (MBKT)',
        'Majlis Perbandaran Kemaman (MPKm)',
        'Majlis Perbandaran Dungun (MPD)',
    ],
    'W.P. Kuala Lumpur': [
        'Dewan Bandaraya Kuala Lumpur (DBKL)',
    ],
    'W.P. Putrajaya': [
        'Perbadanan Putrajaya (PPj)',
    ],
    'W.P. Labuan': [
        'Perbadanan Labuan (PL)',
    ],
};

// Typical cukai tanah due periods by state
export const CUKAI_TANAH_DUE = {
    'Selangor': { month: 5, label: 'May (31 May)' },
    'W.P. Kuala Lumpur': { month: 5, label: 'May (31 May)' },
    'Johor': { month: 6, label: 'June (30 Jun)' },
    'Pulau Pinang': { month: 5, label: 'May (31 May)' },
    'Perak': { month: 6, label: 'June (30 Jun)' },
    'Pahang': { month: 6, label: 'June (30 Jun)' },
    'Kedah': { month: 5, label: 'May (31 May)' },
    'Kelantan': { month: 6, label: 'June (30 Jun)' },
    'Melaka': { month: 5, label: 'May (31 May)' },
    'Negeri Sembilan': { month: 6, label: 'June (30 Jun)' },
    'Terengganu': { month: 6, label: 'June (30 Jun)' },
    'Perlis': { month: 5, label: 'May (31 May)' },
    'Sabah': { month: 6, label: 'June (30 Jun)' },
    'Sarawak': { month: 6, label: 'June (30 Jun)' },
    'W.P. Putrajaya': { month: 5, label: 'May (31 May)' },
    'W.P. Labuan': { month: 6, label: 'June (30 Jun)' },
};

// Cukai taksiran typically paid half-yearly: Jan & Jul or Feb & Aug
export const CUKAI_TAKSIRAN_CYCLES = [
    { value: 'jan_jul', label: 'January & July' },
    { value: 'feb_aug', label: 'February & August' },
    { value: 'yearly', label: 'Yearly' },
];
