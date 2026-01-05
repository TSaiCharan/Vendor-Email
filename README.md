# Job Application Automation

Automate your job applications with AI-powered email generation and Gmail integration.

## Features

- 📝 Create job applications with recruiter email and job description
- 🤖 AI-powered email generation using GPT-5-mini
- 📧 Automatic email sending via Gmail
- 📊 Job queue system (processes one job at a time)
- 📈 Real-time status tracking (queued, processing, success, failure)
- 🔄 Auto-refresh dashboard
- 📁 Daily JSON file storage (no database required)

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Gmail Configuration

To send emails via Gmail, you need to:

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. Create a `.env.local` file in the root directory:

\`\`\`env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 3. Resume File Path

Update the default resume path in `components/create-job-dialog.tsx`:

\`\`\`typescript
const DEFAULT_RESUME_PATH = "/Users/yourname/Documents/resume.pdf"
\`\`\`

Or enter it each time when creating a job.

### 4. Start the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open http://localhost:3000 to use the application.

## How It Works

1. **Create a Job**: Click "Create Job" button and fill in:
   - Recruiter email address
   - Job description
   - AI prompt (pre-filled, editable)
   - Resume file path (pre-filled, editable)

2. **Job Queue**: Jobs are added with "queued" status

3. **Processing**: The system automatically:
   - Processes one job at a time every 10 seconds
   - Reads your resume file
   - Generates personalized email using AI
   - Sends email with resume attachment
   - Updates job status

4. **Status Tracking**: Monitor all jobs on the dashboard:
   - 🔵 Queued - Waiting to be processed
   - 🟡 Processing - Currently being processed
   - 🟢 Success - Email sent successfully
   - 🔴 Failed - Error occurred (check error message)

## JSON Storage

**For v0 Preview (Demo Mode):**
- Uses browser localStorage to demonstrate functionality
- Data persists in your browser only
- No actual file system access
- Perfect for testing the UI and workflow

**For Local Development (Production Mode):**
- Jobs are stored in daily JSON files: `data/YYYY-MM-DD.json`
- The home screen only displays today's jobs
- Old job files can be manually deleted from the `data/` folder
- No database setup required - everything runs locally

**To enable file system storage locally:**
1. In your API route files, change the import:
   \`\`\`typescript
   // Change from:
   import { getTodayJobs, createJob } from "@/lib/json-storage"
   
   // To:
   import { getTodayJobs, createJob } from "@/lib/json-storage-fs"
   \`\`\`
2. Update imports in:
   - `app/api/jobs/create/route.ts`
   - `app/api/process-jobs/route.ts`
   - `app/page.tsx`

## File Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── generate-email/    # AI email generation
│   │   ├── send-email/         # Gmail integration
│   │   ├── process-jobs/       # Job queue processor
│   │   └── jobs/create/        # Create new job
│   └── page.tsx                # Home page (today's jobs)
├── components/
│   ├── create-job-dialog.tsx   # Job creation form
│   ├── job-card.tsx            # Job status card
│   └── job-processor-client.tsx # Auto-refresh client
├── lib/
│   ├── json-storage.ts         # JSON file operations
│   ├── json-storage-fs.ts      # JSON file operations for local storage
│   ├── job-processor.ts        # Job processing logic
│   ├── gmail.ts                # Gmail email sending
│   └── types.ts                # TypeScript types
└── data/                       # Daily JSON files (auto-created)
    └── 2025-01-15.json
\`\`\`

## Troubleshooting

- **Gmail Authentication Error**: Make sure you're using an App Password, not your regular Gmail password
- **Resume File Not Found**: Check that the resume path is correct and the file exists
- **AI Generation Failed**: Ensure you have internet connection for AI API calls
- **Jobs Not Processing**: Check the browser console for errors

## Important Notes

- This app is designed for **local use only**
- Jobs are processed one at a time every 10 seconds
- Only today's jobs are displayed on the home screen
- Make sure your resume file path is correct and accessible
- Gmail has sending limits (500 emails/day for free accounts)
- Keep your Gmail app password secure and never commit it to version control
- The `data/` folder is automatically created and gitignored
