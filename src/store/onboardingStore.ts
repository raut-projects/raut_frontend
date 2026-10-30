import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  languagePreference: 'en' | 'sw';
}

interface DriverInfo {
  nationalIdNumber: string;
  licenseNumber: string;
  profilePhoto: File | null;
  licensePhoto: File | null;
}

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
  frontPhoto: File | null;
  rearPhoto: File | null;
  insuranceDoc: File | null;
  vehicleCardDoc: File | null;
  latraStickerDoc: File | null;
}

interface PaymentDetails {
  accountName: string;
  address: string;
  mobileMoneyNumber: string;
  mobileNetwork: 'vodacom' | 'airtel' | 'halotel' | 'mixx';
}

interface CompletedSteps {
  1: boolean;
  2: boolean;
  3: boolean;
  4: boolean;
}

interface OnboardingStore {
  currentStep: number;
  personalInfo: PersonalInfo;
  driverInfo: DriverInfo;
  vehicleInfo: VehicleInfo;
  paymentDetails: PaymentDetails;
  completedSteps: CompletedSteps;
  termsAccepted: boolean;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updatePersonalInfo: (data: Partial<PersonalInfo>) => void;
  updateDriverInfo: (data: Partial<DriverInfo>) => void;
  updateVehicleInfo: (data: Partial<VehicleInfo>) => void;
  updatePaymentDetails: (data: Partial<PaymentDetails>) => void;
  setTermsAccepted: (accepted: boolean) => void;
  markStepComplete: (step: 1 | 2 | 3 | 4) => void;
  reset: () => void;
}

/**
 * Driver Onboarding Store - Matches Flutter onboarding exactly
 */
const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
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
        profilePhoto: null,
        licensePhoto: null,
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
        frontPhoto: null,
        rearPhoto: null,
        insuranceDoc: null,
        vehicleCardDoc: null,
        latraStickerDoc: null,
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
            profilePhoto: null,
            licensePhoto: null,
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
            frontPhoto: null,
            rearPhoto: null,
            insuranceDoc: null,
            vehicleCardDoc: null,
            latraStickerDoc: null,
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

export default useOnboardingStore;
