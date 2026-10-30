import { z } from 'zod';

/**
 * Validation Schemas - Match Flutter onboarding exactly
 */

// Step 1: Personal Information
export const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Valid email required'),
  languagePreference: z.enum(['en', 'sw']),
});

// Step 2: Driver Information
export const driverInfoSchema = z.object({
  nationalIdNumber: z.string().min(10, 'At least 10 characters'),
  licenseNumber: z.string().min(8, 'At least 8 characters'),
  profilePhotoUrl: z.string().min(1, 'Profile photo required'),
  licensePhotoUrl: z.string().min(1, 'License photo required'),
});

// Step 3: Vehicle Information
export const vehicleInfoSchema = z.object({
  vehicleType: z.enum(['boda', 'car', 'bajaji']),
  plateNumber: z.string().min(3, 'Plate number required'),
  manufacturer: z.string().min(2, 'Manufacturer required'),
  model: z.string().min(2, 'Model required'),
  year: z.number().min(2010).max(new Date().getFullYear()),
  color: z.string().min(2, 'Color required'),
  availableSeats: z.number().min(1).max(50),
  ownershipType: z.enum([
    'fully_paid',
    'financed',
    'lease_individual',
    'lease_company',
    'work_to_own',
  ]),
  ownerName: z.string().min(2, 'Owner name required'),
  ownerEmail: z.string().email('Valid email required'),
  ownerPhone: z.string().min(9, 'Valid phone required').max(9, 'Phone must be 9 digits'),
  frontPhotoUrl: z.string().min(1, 'Front photo required'),
  rearPhotoUrl: z.string().min(1, 'Rear photo required'),
  insuranceDocUrl: z.string().min(1, 'Insurance document required'),
  vehicleCardDocUrl: z.string().min(1, 'Vehicle card required'),
  latraStickerDocUrl: z.string().min(1, 'LATRA sticker required'),
  vehicleId: z.string().optional(),
});

// Step 4: Payment Details
export const paymentDetailsSchema = z.object({
  accountName: z.string().min(2, 'Account name required'),
  address: z.string().min(5, 'Address required'),
  mobileMoneyNumber: z.string().min(10, 'Valid mobile money number required'),
  mobileNetwork: z.enum(['vodacom', 'airtel', 'halotel', 'mixx']),
});

// Helper: Validate file size and type
export const validateFile = (file: File | null, maxSizeMB = 5) => {
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
