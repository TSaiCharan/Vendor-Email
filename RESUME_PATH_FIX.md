# Resume Path Fix - Production-Ready Job Processing

## Problem Fixed

The app was failing with "Resume path not found" because:
1. Jobs were storing local file paths (e.g., `C:/Users/...`)
2. Local paths don't work on Vercel, GitHub Actions, or any cloud environment
3. Job processor tried to read files from the filesystem which doesn't exist on serverless

## Solution Implemented

### 1. **Cloud-Based Resume Storage** ✅
- Resumes are now uploaded to **Supabase Storage**
- Each resume gets a public HTTPS URL
- URLs work everywhere: local, Vercel, GitHub, etc.

### 2. **Smart Resume Handling** ✅
Updated [lib/job-processor.ts](lib/job-processor.ts):
- Detects if resume path is a URL or local file
- **If URL**: Downloads from cloud and extracts text
- **If local**: Reads from filesystem (dev only)
- Handles both PDF and text files

### 3. **Email Attachments** ✅
Updated [lib/gmail.ts](lib/gmail.ts):
- Downloads resume from Supabase URL
- Converts to Buffer and attaches to email
- Gracefully handles failures

### 4. **Inline Resume Upload** ✅
Updated [components/create-job-dialog.tsx](components/create-job-dialog.tsx):
- Quick upload button in job creation dialog
- No need to switch pages
- Auto-selects uploaded resume

## How to Use

### Upload Resumes
1. **Option A**: Click "Create Job" → "Upload Resume" button (new inline feature)
2. **Option B**: Go to `/resume` page and upload there

### Create Jobs
Jobs will now work with uploaded resumes:
- Resume is stored on Supabase (cloud safe)
- When job is processed:
  - Processor downloads from Supabase URL
  - Extracts text from PDF/TXT
  - Passes to OpenAI for email generation
  - Attaches to email sent via Gmail
- All file operations are cloud-safe

## File Changes

| File | Change |
|------|--------|
| [lib/job-processor.ts](lib/job-processor.ts) | Handle URLs + local paths, download resumes from Supabase |
| [lib/gmail.ts](lib/gmail.ts) | Download attachments from URLs |
| [components/create-job-dialog.tsx](components/create-job-dialog.tsx) | Added inline resume upload, better error handling |

## Production Deployment

✅ **Now works on**:
- Local development
- Vercel
- GitHub Pages / GitHub Actions
- AWS Lambda
- Any serverless environment

✅ **Requirements**:
- Supabase account (for storage)
- OpenAI API key
- Gmail credentials

## Testing

1. Create a new job:
   - Upload a resume (PDF or TXT)
   - Fill in recruiter email and job description
   - Click "Submit Job"

2. Check job status:
   - Should appear in dashboard as "Queued"
   - Within 5 seconds should change to "Processing"
   - Then "Success" with email sent

3. Verify email:
   - Check recruiter's inbox
   - Resume should be attached

## Troubleshooting

### Resume upload fails
- Check Supabase storage bucket exists
- Verify user has correct Supabase permissions
- Check file size limit

### Job processing fails with "Resume not found"
- Ensure resume is uploaded to Supabase (not local path)
- Check job.resume_path contains HTTPS URL
- Verify Supabase URL is accessible

### Email doesn't attach resume
- Check resume URL is public
- Verify network allows downloading from Supabase
- Check Gmail doesn't reject large attachments

## Architecture

```
User Upload Resume
    ↓
    ├→ Stored in Supabase Storage
    └→ URL saved in database

Create Job
    ↓
    ├→ Resume path = Supabase URL
    └→ Job queued

Process Job
    ↓
    ├→ Download resume from URL
    ├→ Extract text (PDF parsing)
    ├→ Generate email (OpenAI)
    ├→ Download resume again
    ├→ Attach to email
    ├→ Send via Gmail
    └→ Update status → Success
```

## API Endpoints

### Upload Resume
```
POST /api/resumes/upload
Content-Type: multipart/form-data
Body: file=<binary>

Response: { success: true, url: "https://..." }
```

### Create Job (with Supabase URL)
```
POST /api/jobs/create
Body: {
  recruiter_email: "...",
  job_description: "...",
  ai_prompt: "...",
  resume_path: "https://supabase-url-to-resume.pdf"
}
```

## Notes

- Resumes now persist in Supabase (won't disappear on server restart)
- URLs are permanent and accessible globally
- PDF extraction requires `pdf-parse` (optional fallback)
- All file operations are non-blocking and production-safe
