/**
 * Upload Service - Handles file uploads for driver onboarding
 *
 * Backend endpoints:
 * - POST /drivers/documents - Upload document with doc_type and optional vehicle_id
 * - Backend automatically replaces on re-upload via ON CONFLICT DO UPDATE
 */

import { API_BASE_URL } from '../lib/config';
import { getAccessToken } from './tokenStore';

export interface UploadResult {
  id: string;
  user_id: string;
  doc_type: string;
  file_url: string;
  file_name: string;
  vehicle_id?: string;
  status: string;
  expires_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
}

/**
 * Upload a document to MinIO storage
 * Creates a record in documents table for admin review
 *
 * Valid doc_types:
 * - profile_photo
 * - license
 * - registration
 * - insurance
 * - inspection
 * - certificate_of_authorization
 * - sticker_photo
 * - vehicle_photo
 */
export async function uploadDocument(
  file: File,
  docType: string,
  vehicleId?: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doc_type', docType);

  if (vehicleId) {
    formData.append('vehicle_id', vehicleId);
  }

  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/drivers/documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type - browser will set it with boundary for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  const result = await response.json();
  return result.data;
}

/**
 * NOTE: Backend does NOT have a delete endpoint for documents
 * Instead, re-uploading with the same doc_type automatically replaces the old one
 * via ON CONFLICT (user_id, doc_type) DO UPDATE
 */
