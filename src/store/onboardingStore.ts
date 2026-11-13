/**
 * Persisted four-step driver-onboarding store. Step data, flags, language, and
 * token survive reloads via the `driver-onboarding-storage` localStorage key.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLanguageFromURL, getTokenFromURL, type Language } from '../lib/i18n';

/** Step 1 draft; `languagePreference` is the UI locale code. */
interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  languagePreference: 'en' | 'sw';
}

/** Step 2 draft; photo fields hold URLs returned by the upload service. */
interface DriverInfo {
  nationalIdNumber: string;
  licenseNumber: string;
  profilePhotoUrl: string;
  licensePhotoUrl: string;
}

/**
 * Step 3 draft. `year` is the vehicle model year and `availableSeats` the
 * passenger capacity; `vehicleId` is set once the backend creates the record.
 */
interface VehicleInfo {
  vehicleType: 'boda' | 'car' | 'bajaji';
  plateNumber: string;
  manufacturer: string;
  model: string;
  year: number;
  color: string;
  availableSeats: number;
  ownershipType: 'fully_paid' | 'financed' | 'lease_individual' | 'lease_company' | 'work_to_own';
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  frontPhotoUrl: string;
  rearPhotoUrl: string;
  insuranceDocUrl: string;
  vehicleCardDocUrl: string;
  latraStickerDocUrl: string;
  vehicleId?: string; // Returned from backend after creating vehicle
}

/** Step 4 draft; `mobileNetwork` is one of the supported Tanzanian networks. */
interface PaymentDetails {
  accountName: string;
  address: string;
  mobileMoneyNumber: string;
  mobileNetwork: 'vodacom' | 'airtel' | 'halotel' | 'mixx';
}

/** Per-step completion flags; step numbers are literal keys. */
interface CompletedSteps {
  1: boolean;
  2: boolean;
  3: boolean;
  4: boolean;
}

interface OnboardingStore {
  currentStep: number;
  language: Language;
  token: string | null;
  personalInfo: PersonalInfo;
  driverInfo: DriverInfo;
  vehicleInfo: VehicleInfo;
  paymentDetails: PaymentDetails;
  completedSteps: CompletedSteps;
  termsAccepted: boolean;
  /** Sets the UI language and persists it with the draft. */
  setLanguage: (lang: Language) => void;
  /** Stores the onboarding token from the URL; null clears it. */
  setToken: (token: string | null) => void;
  /** Jumps directly to a step without changing completion flags. */
  setCurrentStep: (step: number) => void;
  /** Advances one step, clamped at step 4. */
  nextStep: () => void;
  /** Moves back one step, clamped at step 1. */
  prevStep: () => void;
  /** Merges partial step-1 values into the existing draft. */
  updatePersonalInfo: (data: Partial<PersonalInfo>) => void;
  /** Merges partial step-2 values into the existing draft. */
  updateDriverInfo: (data: Partial<DriverInfo>) => void;
  /** Merges partial step-3 values into the existing draft. */
  updateVehicleInfo: (data: Partial<VehicleInfo>) => void;
  /** Merges partial step-4 values into the existing draft. */
  updatePaymentDetails: (data: Partial<PaymentDetails>) => void;
  /** Records whether the driver accepted the terms. */
  setTermsAccepted: (accepted: boolean) => void;
  /** Marks a single step complete without touching the others. */
  markStepComplete: (step: 1 | 2 | 3 | 4) => void;
  /** Clears all step data; language and token are left untouched. */
  reset: () => void;
}

/**
 * Driver Onboarding Store - Matches Flutter onboarding exactly
 */
const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      language: getLanguageFromURL(),
      token: getTokenFromURL(),

      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        languagePreference: getLanguageFromURL(),
      },

      driverInfo: {
        nationalIdNumber: '',
        licenseNumber: '',
        profilePhotoUrl: '',
        licensePhotoUrl: '',
      },

      vehicleInfo: {
        vehicleType: 'boda',
        plateNumber: '',
        manufacturer: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        availableSeats: 1,
        ownershipType: 'fully_paid',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        frontPhotoUrl: '',
        rearPhotoUrl: '',
        insuranceDocUrl: '',
        vehicleCardDocUrl: '',
        latraStickerDocUrl: '',
      },

      paymentDetails: {
        accountName: '',
        address: '',
        mobileMoneyNumber: '',
        mobileNetwork: 'vodacom',
      },

      completedSteps: {
        1: false,
        2: false,
        3: false,
        4: false,
      },

      termsAccepted: false,

      setLanguage: (lang) => set({ language: lang }),

      setToken: (token) => set({ token }),

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 4) {
          set({ currentStep: currentStep + 1 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      updatePersonalInfo: (data) =>
        set((state) => ({
          personalInfo: { ...state.personalInfo, ...data },
        })),

      updateDriverInfo: (data) =>
        set((state) => ({
          driverInfo: { ...state.driverInfo, ...data },
        })),

      updateVehicleInfo: (data) =>
        set((state) => ({
          vehicleInfo: { ...state.vehicleInfo, ...data },
        })),

      updatePaymentDetails: (data) =>
        set((state) => ({
          paymentDetails: { ...state.paymentDetails, ...data },
        })),

      setTermsAccepted: (accepted) => set({ termsAccepted: accepted }),

      markStepComplete: (step) =>
        set((state) => ({
          completedSteps: { ...state.completedSteps, [step]: true },
        })),

      reset: () =>
        set({
          currentStep: 1,
          personalInfo: {
            firstName: '',
            lastName: '',
            email: '',
            languagePreference: 'en',
          },
          driverInfo: {
            nationalIdNumber: '',
            licenseNumber: '',
            profilePhotoUrl: '',
            licensePhotoUrl: '',
          },
          vehicleInfo: {
            vehicleType: 'boda',
            plateNumber: '',
            manufacturer: '',
            model: '',
            year: new Date().getFullYear(),
            color: '',
            availableSeats: 1,
            ownershipType: 'fully_paid',
            ownerName: '',
            ownerEmail: '',
            ownerPhone: '',
            frontPhotoUrl: '',
            rearPhotoUrl: '',
            insuranceDocUrl: '',
            vehicleCardDocUrl: '',
            latraStickerDocUrl: '',
          },
          paymentDetails: {
            accountName: '',
            address: '',
            mobileMoneyNumber: '',
            mobileNetwork: 'vodacom',
          },
          completedSteps: {
            1: false,
            2: false,
            3: false,
            4: false,
          },
          termsAccepted: false,
        }),
    }),
    {
      name: 'driver-onboarding-storage',
    }
  )
);

/** Default onboarding store instance backed by localStorage persistence. */
export default useOnboardingStore;
