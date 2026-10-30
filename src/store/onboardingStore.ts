import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PersonalInfo {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  nin: string;
  address: string;
  city: string;
  region: string;
}

interface DriverInfo {
  licenseNumber: string;
  licenseIssueDate: string;
  licenseExpiryDate: string;
  yearsOfExperience: string;
  previousEmployer: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

interface VehicleInfo {
  plateNumber: string;
  make: string;
  model: string;
  year: string;
  color: string;
  vehicleType: 'car' | 'bajaj' | 'bodaboda';
  seats: number;
  insurancePolicyNumber: string;
  insuranceExpiryDate: string;
}

interface Documents {
  profilePhoto: File | null;
  licensePhoto: File | null;
  ninPhoto: File | null;
  vehicleRegistration: File | null;
  insuranceCertificate: File | null;
  vehiclePhoto: File | null;
}

interface UploadedDocuments {
  profilePhoto: string;
  licensePhoto: string;
  ninPhoto: string;
  vehicleRegistration: string;
  insuranceCertificate: string;
  vehiclePhoto: string;
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
  documents: Documents;
  uploadedDocuments: UploadedDocuments;
  completedSteps: CompletedSteps;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updatePersonalInfo: (data: Partial<PersonalInfo>) => void;
  updateDriverInfo: (data: Partial<DriverInfo>) => void;
  updateVehicleInfo: (data: Partial<VehicleInfo>) => void;
  updateDocuments: (data: Partial<Documents>) => void;
  updateUploadedDocuments: (data: Partial<UploadedDocuments>) => void;
  markStepComplete: (step: 1 | 2 | 3 | 4) => void;
  reset: () => void;
}

/**
 * Driver Onboarding Store
 *
 * Manages the multi-step onboarding flow state
 */
const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      // Current step (1-5)
      currentStep: 1,

      // Personal Information
      personalInfo: {
        fullName: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        nin: '', // National ID Number
        address: '',
        city: '',
        region: '',
      },

      // Driver Information
      driverInfo: {
        licenseNumber: '',
        licenseIssueDate: '',
        licenseExpiryDate: '',
        yearsOfExperience: '',
        previousEmployer: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
      },

      // Vehicle Information
      vehicleInfo: {
        plateNumber: '',
        make: '',
        model: '',
        year: '',
        color: '',
        vehicleType: 'car', // car, bajaj, bodaboda
        seats: 4,
        insurancePolicyNumber: '',
        insuranceExpiryDate: '',
      },

      // Documents (file uploads)
      documents: {
        profilePhoto: null,
        licensePhoto: null,
        ninPhoto: null,
        vehicleRegistration: null,
        insuranceCertificate: null,
        vehiclePhoto: null,
      },

      // Uploaded file URLs (after upload to backend)
      uploadedDocuments: {
        profilePhoto: '',
        licensePhoto: '',
        ninPhoto: '',
        vehicleRegistration: '',
        insuranceCertificate: '',
        vehiclePhoto: '',
      },

      // Step completion status
      completedSteps: {
        1: false,
        2: false,
        3: false,
        4: false,
      },

      // Actions
      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 5) {
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

      updateDocuments: (data) =>
        set((state) => ({
          documents: { ...state.documents, ...data },
        })),

      updateUploadedDocuments: (data) =>
        set((state) => ({
          uploadedDocuments: { ...state.uploadedDocuments, ...data },
        })),

      markStepComplete: (step) =>
        set((state) => ({
          completedSteps: { ...state.completedSteps, [step]: true },
        })),

      // Reset store (after successful submission)
      reset: () =>
        set({
          currentStep: 1,
          personalInfo: {
            fullName: '',
            phone: '',
            email: '',
            dateOfBirth: '',
            nin: '',
            address: '',
            city: '',
            region: '',
          },
          driverInfo: {
            licenseNumber: '',
            licenseIssueDate: '',
            licenseExpiryDate: '',
            yearsOfExperience: '',
            previousEmployer: '',
            emergencyContactName: '',
            emergencyContactPhone: '',
          },
          vehicleInfo: {
            plateNumber: '',
            make: '',
            model: '',
            year: '',
            color: '',
            vehicleType: 'car',
            seats: 4,
            insurancePolicyNumber: '',
            insuranceExpiryDate: '',
          },
          documents: {
            profilePhoto: null,
            licensePhoto: null,
            ninPhoto: null,
            vehicleRegistration: null,
            insuranceCertificate: null,
            vehiclePhoto: null,
          },
          uploadedDocuments: {
            profilePhoto: '',
            licensePhoto: '',
            ninPhoto: '',
            vehicleRegistration: '',
            insuranceCertificate: '',
            vehiclePhoto: '',
          },
          completedSteps: {
            1: false,
            2: false,
            3: false,
            4: false,
          },
        }),
    }),
    {
      name: 'driver-onboarding-storage', // localStorage key
    }
  )
);

export default useOnboardingStore;
