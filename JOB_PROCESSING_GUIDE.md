# Job Processing Setup Guide

## Overview
Jobs are automatically processed after creation. Here's the complete flow:

## 1. Job Submission Flow
1. User clicks "Submit Job"
2. Job is created and stored in Supabase storage with status "queued"
3. Job processor is triggered automatically via `/api/process-jobs`

## 2. Job Processing Steps
The processor (`/lib/job-processor.ts`) does the following:

1. **Read Resume** → Extracts text from resume file (PDF or TXT)
2. **Generate Email** → Calls OpenAI to generate personalized email
3. **Send Email** → Sends email via Gmail to recruiter
4. **Update Status** → Updates job status to "success" or "failure"

## 3. Job Status States
- **queued**: Waiting to be processed
- **processing**: Currently being processed
- **success**: Email sent successfully
- **failure**: Processing failed (error_message contains reason)

## 4. Required Setup

### Environment Variables
You need these in your `.env.local`:

```
# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# App URL (for internal API calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Alternative: Database API Keys
If you don't want to use environment variables, you can store credentials in the database:

1. Go to `/account` page
2. Enter your OpenAI API key, Gmail user, and Gmail app password
3. These will be fetched automatically when processing jobs

## 5. How to Get Gmail App Password
1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account → Security → App passwords
3. Select "Mail" and "Windows Computer"
4. Generate a 16-character password
5. Use this password in GMAIL_APP_PASSWORD

## 6. API Endpoints

### Create Job
```
POST /api/jobs/create
Body: {
  recruiter_email: string
  job_description: string
  ai_prompt: string
  resume_path: string
}
Response: { success: true, job: Job }
```

### Process Jobs
```
POST /api/process-jobs
Body: {
  openai_api_key?: string
  gmail_user?: string
  gmail_app_password?: string
}
Response: { success: true, jobId: string }
```

### Get Job Status
```
GET /api/jobs/status?id=JOB_ID
Response: { success: true, job: Job }
```

### Get Today's Jobs
```
GET /api/jobs/today
Response: { success: true, jobs: Job[] }
```

### Get Jobs by Date
```
GET /api/jobs?date=2026-01-31
Response: { success: true, jobs: Job[] }
```

## 7. Monitoring Jobs

### Via UI
1. Jobs appear in the home page dashboard
2. Status badges show: Queued (blue), Processing (yellow), Success (green), Failed (red)

### Via API Debug
```
curl http://localhost:3000/api/jobs/status?id=YOUR_JOB_ID
```

## 8. Troubleshooting

### Job stays in "queued" status
- Check if API keys are configured (environment or database)
- Check browser console for error messages
- Check terminal logs for processing errors

### Email not sending
- Verify Gmail credentials
- Check if 2FA is enabled
- Verify app password is correct
- Check spam folder

### AI email generation fails
- Verify OpenAI API key is valid
- Check OpenAI account has credits
- Check token limits not exceeded

### Resume not being read
- Verify file exists at path
- For PDFs: requires `pdf-parse` package
- For TXT: should work automatically

## 9. Data Storage
- Jobs stored in: Supabase storage → `jobs` bucket
- File naming: `YYYY-MM-DD.json` (Chicago time)
- Format: JSON array of Job objects

## 10. Chicago Time
All dates are in Chicago timezone (Central Time) to match your location.
This affects:
- Job file names
- Date filtering
- Date display in UI
