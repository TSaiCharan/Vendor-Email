'use client'

import { supabase } from '@/lib/supabase'

/**
 * Upload a resume file to Supabase Storage in user's personal bucket
 * @param userEmail - The user's email
 * @param file - The file to upload
 * @returns The public URL of the uploaded file, or null if failed
 */
export async function uploadResume(userEmail: string, file: File): Promise<string | null> {
  try {
    if (!file) {
      throw new Error('No file provided')
    }

    // Convert email to bucket name (lowercase, replace special chars with dashes)
    const bucketName = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '-')
    
    // Generate unique filename in resumes folder
    const timestamp = Date.now()
    const filename = `resumes/${timestamp}_${file.name}`

    console.log('[resume-storage] Uploading resume to bucket:', bucketName, 'path:', filename)

    // Upload to user's personal Supabase Storage bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('[resume-storage] Upload error:', error)
      return null
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename)

    console.log('[resume-storage] Resume uploaded successfully:', publicUrl)
    return publicUrl
  } catch (error) {
    console.error('[resume-storage] Error uploading resume:', error)
    return null
  }
}

/**
 * Delete a resume file from user's personal bucket
 * @param userEmail - The user's email
 * @param filePath - The file path in storage (returned from uploadResume)
 * @returns true if deleted successfully, false otherwise
 */
export async function deleteResume(userEmail: string, filePath: string): Promise<boolean> {
  try {
    const bucketName = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '-')
    
    // Extract the path from the public URL if needed
    let path = filePath
    if (filePath.includes('/storage/v1/object/public/')) {
      path = filePath.split('/storage/v1/object/public/')[1]
      path = path.split('/').slice(1).join('/') // Remove bucket name from path
    }

    console.log('[resume-storage] Deleting resume from bucket:', bucketName, 'path:', path)

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path])

    if (error) {
      console.error('[resume-storage] Delete error:', error)
      return false
    }

    console.log('[resume-storage] Resume deleted successfully')
    return true
  } catch (error) {
    console.error('[resume-storage] Error deleting resume:', error)
    return false
  }
}

/**
 * Get download URL for a resume file from user's personal bucket
 * @param userEmail - The user's email
 * @param filePath - The file path or public URL
 * @param expiresIn - Expiration time in seconds (default: 3600)
 * @returns Signed download URL
 */
export async function getResumeDownloadUrl(
  userEmail: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const bucketName = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '-')
    
    // Extract the path from the public URL if needed
    let path = filePath
    if (filePath.includes('/storage/v1/object/public/')) {
      path = filePath.split('/storage/v1/object/public/')[1]
      path = path.split('/').slice(1).join('/') // Remove bucket name from path
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('[resume-storage] Error creating signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('[resume-storage] Error getting download URL:', error)
    return null
  }
}
