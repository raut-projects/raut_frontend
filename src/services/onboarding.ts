/**
 * Driver Onboarding API Service
 *
 * Uses existing backend endpoints:
 * - POST /drivers/register
 * - POST /drivers/vehicles
 * - POST /drivers/documents
 * - POST /drivers/onboarding/complete
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Map frontend document names to backend doc_type enum values
 */
const DOC_TYPE_MAP: Record<string, string> = {
  profilePhoto: 'profile_photo',
  licensePhoto: 'license',
  ninPhoto: 'nin',
  vehicleRegistration: 'registration',
  insuranceCertificate: 'insurance',
  vehiclePhoto: 'vehicle_photo',
};

interface OnboardingData {
  personalInfo: {
    fullName: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    nin: string;
    address: string;
    city: string;
    region: string;
  };
  driverInfo: {
    licenseNumber: string;
    licenseIssueDate: string;
    licenseExpiryDate: string;
    yearsOfExperience: string;
    previousEmployer: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
  vehicleInfo: {
    plateNumber: string;
    make: string;
    model: string;
    year: string;
    color: string;
    vehicleType: 'car' | 'bajaj' | 'bodaboda';
    seats: number;
    insurancePolicyNumber: string;
    insuranceExpiryDate: string;
  };
  documents: {
    profilePhoto: File | null;
    licensePhoto: File | null;
    ninPhoto: File | null;
    vehicleRegistration: File | null;
    insuranceCertificate: File | null;
    vehiclePhoto: File | null;
  };
}

/**
 * Upload a single document file using existing backend endpoint
 * POST /drivers/documents
 */
async function uploadDocument(
  file: File,
  fieldName: string,
  vehicleId?: string,
  expiresAt?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doc_type', DOC_TYPE_MAP[fieldName] || fieldName);

  if (vehicleId) {
    formData.append('vehicle_id', vehicleId);
  }

  if (expiresAt) {
    formData.append('expires_at', expiresAt);
  }

  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/drivers/documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.message || 'Failed to upload document');
  }

  const data = await response.json();
  return data.data.id;
}

/**
 * Submit complete onboarding application
 */
export async function submitOnboarding(data: OnboardingData) {
  try {
    const token = getAuthToken();

    // Step 1: Register as driver
    // POST /drivers/register
    let registerResponse = await fetch(`${API_BASE_URL}/drivers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!registerResponse.ok) {
      const error = await registerResponse.json();
      throw new Error(error.detail || error.message || 'Failed to register as driver');
    }

    // Step 2: Create vehicle
    // POST /drivers/vehicles
    const vehiclePayload = {
      plate_number: data.vehicleInfo.plateNumber.toUpperCase(),
      make: data.vehicleInfo.make,
      model: data.vehicleInfo.model,
      year: parseInt(data.vehicleInfo.year),
      color: data.vehicleInfo.color,
      vehicle_type: data.vehicleInfo.vehicleType,
      passenger_capacity: data.vehicleInfo.seats,
      insurance_policy_number: data.vehicleInfo.insurancePolicyNumber,
      insurance_expiry_date: data.vehicleInfo.insuranceExpiryDate,
    };

    const vehicleResponse = await fetch(`${API_BASE_URL}/drivers/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(vehiclePayload),
    });

    if (!vehicleResponse.ok) {
      const error = await vehicleResponse.json();
      throw new Error(error.detail || error.message || 'Failed to create vehicle');
    }

    const vehicleData = await vehicleResponse.json();
    const vehicleId = vehicleData.data.id;

    // Step 3: Upload all documents
    // POST /drivers/documents (multiple times)
    const uploadPromises = [];

    // User documents (no vehicle_id)
    if (data.documents.profilePhoto) {
      uploadPromises.push(uploadDocument(data.documents.profilePhoto, 'profilePhoto'));
    }
    if (data.documents.licensePhoto) {
      uploadPromises.push(
        uploadDocument(
          data.documents.licensePhoto,
          'licensePhoto',
          undefined,
          data.driverInfo.licenseExpiryDate
        )
      );
    }
    if (data.documents.ninPhoto) {
      uploadPromises.push(uploadDocument(data.documents.ninPhoto, 'ninPhoto'));
    }

    // Vehicle documents (with vehicle_id)
    if (data.documents.vehicleRegistration) {
      uploadPromises.push(
        uploadDocument(data.documents.vehicleRegistration, 'vehicleRegistration', vehicleId)
      );
    }
    if (data.documents.insuranceCertificate) {
      uploadPromises.push(
        uploadDocument(
          data.documents.insuranceCertificate,
          'insuranceCertificate',
          vehicleId,
          data.vehicleInfo.insuranceExpiryDate
        )
      );
    }
    if (data.documents.vehiclePhoto) {
      uploadPromises.push(
        uploadDocument(data.documents.vehiclePhoto, 'vehiclePhoto', vehicleId)
      );
    }

    await Promise.all(uploadPromises);

    // Step 4: Complete onboarding
    // POST /drivers/onboarding/complete
    const completeResponse = await fetch(
      `${API_BASE_URL}/drivers/onboarding/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!completeResponse.ok) {
      const error = await completeResponse.json();
      throw new Error(error.detail || error.message || 'Failed to complete onboarding');
    }

    const result = await completeResponse.json();
    return result.data;
  } catch (error) {
    console.error('Onboarding submission error:', error);
    throw error;
  }
}

/**
 * Get authentication token from URL params or localStorage
 */
function getAuthToken(): string | null {
  // First check URL params (passed from Flutter WebView)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');

  if (tokenFromUrl) {
    // Store token in localStorage for subsequent requests
    localStorage.setItem('auth_token', tokenFromUrl);
    return tokenFromUrl;
  }

  // Fallback to localStorage
  return localStorage.getItem('auth_token');
}
