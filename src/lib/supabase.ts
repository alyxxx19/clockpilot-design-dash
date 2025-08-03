// Mock Supabase client for development
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: ({ email, password }: { email: string; password: string }) => {
      // Mock authentication - accept demo credentials
      if (email === 'demo@clockpilot.com' && password === 'demo123') {
        const mockUser = {
          id: 'demo-user-id',
          email: 'demo@clockpilot.com',
          user_metadata: {}
        };
        return Promise.resolve({
          data: { user: mockUser, session: { user: mockUser, access_token: 'mock-token' } },
          error: null
        });
      }
      return Promise.resolve({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });
    },
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback: Function) => {
      // Mock auth state change listener
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  },
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        single: () => {
          // Mock user profile data
          if (table === 'users') {
            return Promise.resolve({
              data: {
                id: 'demo-user-id',
                email: 'demo@clockpilot.com',
                full_name: 'Utilisateur Démo',
                department: 'Développement',
                position: 'Développeur',
                phone: '06 12 34 56 78',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              error: null
            });
          }
          // Mock user settings
          if (table === 'user_settings') {
            return Promise.resolve({
              data: {
                id: 'settings-id',
                user_id: 'demo-user-id',
                email_notifications: true,
                push_notifications: true,
                weekly_reports: false,
                task_deadlines: true,
                theme: 'system',
                language: 'fr',
                timezone: 'Europe/Paris',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              error: null
            });
          }
          return Promise.resolve({ data: null, error: null });
        },
        order: (column: string, options?: any) => ({
          limit: (count: number) => Promise.resolve({ data: [], error: null })
        })
      }),
      gte: (column: string, value: any) => ({
        lte: (column: string, value: any) => ({
          order: (column: string, options?: any) => Promise.resolve({ data: [], error: null })
        })
      }),
      order: (column: string, options?: any) => Promise.resolve({ data: [], error: null })
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => Promise.resolve({
          data: { ...data, id: 'mock-id', created_at: new Date().toISOString() },
          error: null
        })
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => Promise.resolve({
            data: { ...data, updated_at: new Date().toISOString() },
            error: null
          })
        })
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ error: null })
    })
  })
};

// Database types (kept for compatibility)
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