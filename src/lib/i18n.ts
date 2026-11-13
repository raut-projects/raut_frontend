// Driver-onboarding translations. Provides English and Swahili copy for the
// onboarding wizard plus helpers to read the language and token from the URL.

/** Supported UI languages. */
export type Language = 'en' | 'sw';

/** English and Swahili copy keyed by the same set of string keys. */
export const translations = {
  en: {
    // Header
    driverOnboarding: 'Driver Onboarding',
    cancel: 'Cancel',
    step: 'Step',
    of: 'of',
    back: 'Back',
    continue: 'Continue',
    saving: 'Saving...',
    submitting: 'Submitting...',
    completeOnboarding: 'Complete Onboarding',

    // Step 1: Personal Information
    personalInformation: 'Personal Information',
    personalInfoDesc: 'Enter your basic details to get started',
    firstName: 'First Name',
    lastName: 'Last Name',
    emailAddress: 'Email Address',
    preferredLanguage: 'Preferred Language',
    english: 'English',
    swahili: 'Swahili',
    termsText: 'I agree to the',
    termsAndConditions: 'Terms & Conditions',
    and: 'and',
    privacyPolicy: 'Privacy Policy',

    // Step 2: Driver Information
    driverInformation: 'Driver Information',
    driverInfoDesc: 'Provide your identification and license details',
    nationalIdNumber: 'National ID Number',
    licenseNumber: "Driver's License Number",
    profilePhoto: 'Profile Photo',
    licensePhoto: "Driver's License Photo",
    uploadProfilePhoto: 'Upload Profile Photo',
    uploadLicensePhoto: 'Upload License Photo',
    uploaded: 'Uploaded',
    jpgPngMax: 'JPG, PNG (max 5MB)',

    // Step 3: Vehicle Information
    vehicleInformation: 'Vehicle Information',
    vehicleInfoDesc: 'Tell us about your vehicle',
    vehicleType: 'Vehicle Type',
    bodaboda: 'Bodaboda',
    car: 'Car',
    bajaji: 'Bajaji',
    licensePlateNumber: 'License Plate Number',
    manufacturer: 'Manufacturer',
    selectManufacturer: 'Select manufacturer',
    model: 'Model',
    selectModel: 'Select model',
    year: 'Year',
    selectYear: 'Select year',
    color: 'Color',
    selectColor: 'Select color',
    ownershipType: 'Ownership Type',
    selectOwnershipType: 'Select ownership type',
    ownerFullyPaid: 'I am the vehicle owner (Fully Paid)',
    ownerFinanced: 'I am the vehicle owner (Financed/Loan)',
    leaseIndividual: 'I lease/rent vehicle from another person',
    leaseCompany: 'I lease/rent vehicle from a company/SACCOS',
    workToOwn: 'I drive vehicle on a work-to-own/financing arrangement',
    ownerDetails: 'Owner Details',
    ownerName: 'Owner Name',
    ownerEmail: 'Owner Email',
    ownerPhone: 'Owner Phone',
    photosAndDocuments: 'Photos & Documents',
    frontPhoto: 'Front Photo',
    rearPhoto: 'Rear Photo',
    insuranceDocument: 'Insurance Document',
    vehicleCard: 'Vehicle Card',
    latraStickerPhoto: 'LATRA Sticker Photo',

    // Step 4: Payment Details
    paymentDetails: 'Payment Details',
    paymentDetailsDesc: 'Where should we send your earnings?',
    accountName: 'Account Name',
    address: 'Address',
    mobileMoneyNumber: 'Mobile Money Number',
    mobileNetwork: 'Mobile Network',

    // Colors
    white: 'White',
    black: 'Black',
    silver: 'Silver',
    grey: 'Grey',
    red: 'Red',
    blue: 'Blue',
    green: 'Green',
    brown: 'Brown',
    yellow: 'Yellow',
    orange: 'Orange',
  },
  sw: {
    // Header
    driverOnboarding: 'Usajili wa Dereva',
    cancel: 'Ghairi',
    step: 'Hatua',
    of: 'kati ya',
    back: 'Rudi',
    continue: 'Endelea',
    saving: 'Inahifadhi...',
    submitting: 'Inatuma...',
    completeOnboarding: 'Maliza Usajili',

    // Step 1: Personal Information
    personalInformation: 'Taarifa Binafsi',
    personalInfoDesc: 'Weka taarifa zako za msingi kuanza',
    firstName: 'Jina la Kwanza',
    lastName: 'Jina la Ukoo',
    emailAddress: 'Barua Pepe',
    preferredLanguage: 'Lugha Unayopendelea',
    english: 'Kiingereza',
    swahili: 'Kiswahili',
    termsText: 'Ninakubali',
    termsAndConditions: 'Masharti na Vigezo',
    and: 'na',
    privacyPolicy: 'Sera ya Faragha',

    // Step 2: Driver Information
    driverInformation: 'Taarifa za Dereva',
    driverInfoDesc: 'Toa taarifa za kitambulisho na leseni yako',
    nationalIdNumber: 'Namba ya Kitambulisho cha Taifa',
    licenseNumber: 'Namba ya Leseni ya Udereva',
    profilePhoto: 'Picha ya Wasifu',
    licensePhoto: 'Picha ya Leseni ya Udereva',
    uploadProfilePhoto: 'Pakia Picha ya Wasifu',
    uploadLicensePhoto: 'Pakia Picha ya Leseni',
    uploaded: 'Imepakiwa',
    jpgPngMax: 'JPG, PNG (juu ya 5MB)',

    // Step 3: Vehicle Information
    vehicleInformation: 'Taarifa za Gari',
    vehicleInfoDesc: 'Tuambie kuhusu gari lako',
    vehicleType: 'Aina ya Gari',
    bodaboda: 'Pikipiki',
    car: 'Gari',
    bajaji: 'Bajaji',
    licensePlateNumber: 'Namba ya Usajili',
    manufacturer: 'Mtengenezaji',
    selectManufacturer: 'Chagua mtengenezaji',
    model: 'Modeli',
    selectModel: 'Chagua modeli',
    year: 'Mwaka',
    selectYear: 'Chagua mwaka',
    color: 'Rangi',
    selectColor: 'Chagua rangi',
    ownershipType: 'Aina ya Umiliki',
    selectOwnershipType: 'Chagua aina ya umiliki',
    ownerFullyPaid: 'Mimi ni mmiliki wa gari (Nimelipa kikamilifu)',
    ownerFinanced: 'Mimi ni mmiliki wa gari (Kwa mkopo)',
    leaseIndividual: 'Nakodisha gari kutoka kwa mtu mwingine',
    leaseCompany: 'Nakodisha gari kutoka kwa kampuni/SACCOS',
    workToOwn: 'Ninaendesha gari kwa mpango wa kufanya kazi ili kuimiliki',
    ownerDetails: 'Taarifa za Mmiliki',
    ownerName: 'Jina la Mmiliki',
    ownerEmail: 'Barua Pepe ya Mmiliki',
    ownerPhone: 'Simu ya Mmiliki',
    photosAndDocuments: 'Picha na Nyaraka',
    frontPhoto: 'Picha ya Mbele',
    rearPhoto: 'Picha ya Nyuma',
    insuranceDocument: 'Hati ya Bima',
    vehicleCard: 'Kadi ya Gari',
    latraStickerPhoto: 'Picha ya Stika ya LATRA',

    // Step 4: Payment Details
    paymentDetails: 'Taarifa za Malipo',
    paymentDetailsDesc: 'Tunapaswa kutuma mapato yako wapi?',
    accountName: 'Jina la Akaunti',
    address: 'Anwani',
    mobileMoneyNumber: 'Namba ya Pesa za Simu',
    mobileNetwork: 'Mtandao wa Simu',

    // Colors
    white: 'Nyeupe',
    black: 'Nyeusi',
    silver: 'Fedha',
    grey: 'Kijivu',
    red: 'Nyekundu',
    blue: 'Bluu',
    green: 'Kijani',
    brown: 'Hudhurungi',
    yellow: 'Njano',
    orange: 'Machungwa',
  },
};

/**
 * Reads the `lang` query parameter and returns 'sw' only when it is exactly
 * "sw"; otherwise defaults to 'en'. Returns 'en' during SSR.
 */
export function getLanguageFromURL(): Language {
  if (typeof window === 'undefined') return 'en';
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');
  return lang === 'sw' ? 'sw' : 'en';
}

/**
 * Reads the `token` query parameter from the current URL, or null during SSR.
 */
export function getTokenFromURL(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

/**
 * Returns a translate function for the given language.
 *
 * Looks the key up in {@link translations} and falls back to the key itself
 * when no translation exists.
 */
export function useTranslation(lang: Language) {
  return (key: keyof typeof translations.en) => {
    return translations[lang][key] || key;
  };
}
