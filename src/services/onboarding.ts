/**
 * Driver Onboarding API Service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Upload a single document file
 * @param {File} file - The file to upload
 * @param {string} fieldName - The field name (e.g., 'profilePhoto')
 * @returns {Promise<string>} - The uploaded file URL
 */
async function uploadDocument(file, fieldName) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('field_name', fieldName);

  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/drivers/onboarding/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload document');
  }

  const data = await response.json();
  return data.file_url;
}

/**
 * Upload all documents in parallel
 * @param {Object} documents - Object containing all document files
 * @returns {Promise<Object>} - Object with uploaded file URLs
 */
async function uploadAllDocuments(documents) {
  const uploadPromises = Object.entries(documents)
    .filter(([_, file]) => file instanceof File)
    .map(async ([fieldName, file]) => {
      try {
        const fileUrl = await uploadDocument(file, fieldName);
        return [fieldName, fileUrl];
      } catch (error) {
        console.error(`Failed to upload ${fieldName}:`, error);
        throw new Error(`Failed to upload ${fieldName}: ${error.message}`);
      }
    });

  const results = await Promise.all(uploadPromises);
  return Object.fromEntries(results);
}

/**
 * Submit complete onboarding application
 * @param {Object} data - Complete onboarding data
 * @returns {Promise<Object>} - Submission result
 */
export async function submitOnboarding(data) {
  try {
    // Step 1: Upload all documents
    const uploadedDocuments = await uploadAllDocuments(data.documents);

    // Step 2: Prepare submission payload
    const payload = {
      personal_info: {
        full_name: data.personalInfo.fullName,
        phone: data.personalInfo.phone,
        email: data.personalInfo.email || null,
        date_of_birth: data.personalInfo.dateOfBirth,
        nin: data.personalInfo.nin || null,
        address: data.personalInfo.address,
        city: data.personalInfo.city,
        region: data.personalInfo.region,
      },
      driver_info: {
        license_number: data.driverInfo.licenseNumber,
        license_issue_date: data.driverInfo.licenseIssueDate,
        license_expiry_date: data.driverInfo.licenseExpiryDate,
        years_of_experience: parseInt(data.driverInfo.yearsOfExperience),
        previous_employer: data.driverInfo.previousEmployer || null,
        emergency_contact_name: data.driverInfo.emergencyContactName,
        emergency_contact_phone: data.driverInfo.emergencyContactPhone,
      },
      vehicle_info: {
        plate_number: data.vehicleInfo.plateNumber.toUpperCase(),
        make: data.vehicleInfo.make,
        model: data.vehicleInfo.model,
        year: parseInt(data.vehicleInfo.year),
        color: data.vehicleInfo.color,
        vehicle_type: data.vehicleInfo.vehicleType,
        seats: data.vehicleInfo.seats,
        insurance_policy_number: data.vehicleInfo.insurancePolicyNumber,
        insurance_expiry_date: data.vehicleInfo.insuranceExpiryDate,
      },
      documents: {
        profile_photo: uploadedDocuments.profilePhoto,
        license_photo: uploadedDocuments.licensePhoto,
        nin_photo: uploadedDocuments.ninPhoto || null,
        vehicle_registration: uploadedDocuments.vehicleRegistration,
        insurance_certificate: uploadedDocuments.insuranceCertificate,
        vehicle_photo: uploadedDocuments.vehiclePhoto,
      },
    };

    // Step 3: Submit onboarding application
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/drivers/onboarding/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit onboarding');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Onboarding submission error:', error);
    throw error;
  }
}

/**
 * Get authentication token from URL params or localStorage
 * @returns {string|null} - JWT token
 */
function getAuthToken() {
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
