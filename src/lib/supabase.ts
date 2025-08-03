import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTU2NzI0MCwiZXhwIjoxOTYxMTQzMjQwfQ.demo-key';

// For demo purposes, we'll use placeholder values if environment variables are not set
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not found. Using demo mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  department: string;
  position: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  total_hours: number;
  project: string;
  notes?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  weekly_reports: boolean;
  task_deadlines: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}