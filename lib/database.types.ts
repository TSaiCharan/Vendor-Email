export interface User {
  id: string
  email: string
  created_at: string
}

export interface UserApiKeys {
  id: string
  user_id: string
  gmail_user: string
  gmail_app_password: string
  openai_api_key: string
  created_at: string
  updated_at: string
}
