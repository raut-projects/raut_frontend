import { z } from 'zod';

/**
 * Validation Schemas for Driver Onboarding
 */

// Step 1: Personal Information
export const personalInfoSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  phone: z
    .string()
    .regex(/^(\+255|0)[67]\d{8}$/, 'Invalid Tanzanian phone number'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nin: z
    .string()
    .regex(/^\d{20}$/, 'NIN must be 20 digits')
    .optional()
    .or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  region: z.string().min(2, 'Region is required'),
});

// Step 2: Driver Information
export const driverInfoSchema = z.object({
  licenseNumber: z.string().min(5, 'License number is required'),
  licenseIssueDate: z.string().min(1, 'Issue date is required'),
  licenseExpiryDate: z.string().min(1, 'Expiry date is required'),
  yearsOfExperience: z
    .string()
    .regex(/^\d+$/, 'Must be a number')
    .refine((val) => parseInt(val) >= 0, 'Must be 0 or greater'),
  previousEmployer: z.string().optional(),
  emergencyContactName: z
    .string()
    .min(3, 'Emergency contact name is required'),
  emergencyContactPhone: z
    .string()
    .regex(/^(\+255|0)[67]\d{8}$/, 'Invalid phone number'),
});

// Step 3: Vehicle Information
export const vehicleInfoSchema = z.object({
  plateNumber: z
    .string()
    .min(3, 'Plate number is required')
    .regex(/^[A-Z0-9\s-]+$/i, 'Invalid plate number format'),
  make: z.string().min(2, 'Vehicle make is required'),
  model: z.string().min(2, 'Vehicle model is required'),
  year: z
    .string()
    .regex(/^\d{4}$/, 'Must be a 4-digit year')
    .refine(
      (val) =>
        parseInt(val) >= 2000 && parseInt(val) <= new Date().getFullYear(),
      'Year must be between 2000 and current year'
    ),
  color: z.string().min(2, 'Color is required'),
  vehicleType: z.union([
    z.literal('car'),
    z.literal('bajaj'),
    z.literal('bodaboda'),
  ]).refine((val) => ['car', 'bajaj', 'bodaboda'].includes(val), {
    message: 'Select a valid vehicle type',
  }),
  seats: z
    .number()
    .min(1, 'Must have at least 1 seat')
    .max(50, 'Cannot exceed 50 seats'),
  insurancePolicyNumber: z.string().min(3, 'Insurance policy number required'),
  insuranceExpiryDate: z.string().min(1, 'Insurance expiry date required'),
});

// Step 4: Documents (file validation)
export const documentsSchema = z.object({
  profilePhoto: z.any().refine((file) => file !== null, 'Profile photo required'),
  licensePhoto: z.any().refine((file) => file !== null, 'License photo required'),
  ninPhoto: z.any().optional(),
  vehicleRegistration: z.any().refine((file) => file !== null, 'Vehicle registration required'),
  insuranceCertificate: z.any().refine((file) => file !== null, 'Insurance certificate required'),
  vehiclePhoto: z.any().refine((file) => file !== null, 'Vehicle photo required'),
});

// Helper: Validate file size and type
export const validateFile = (file, maxSizeMB = 5) => {
  if (!file) return { valid: false, error: 'No file selected' };

  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPG, PNG, and PDF allowed.',
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  return { valid: true };
};
