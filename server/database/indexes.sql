-- ============================================================================
-- INDEX OPTIMIZATIONS FOR CLOCKPILOT DATABASE
-- Performance optimizations for frequently queried columns
-- ============================================================================

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Employees table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_contract_type ON employees(contract_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_is_active ON employees(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_search ON employees USING gin(to_tsvector('french', first_name || ' ' || last_name || ' ' || email));

-- Composite index for employee queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_active_department ON employees(is_active, department_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_search_active ON employees(is_active, first_name, last_name);

-- Planning table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planning_employee_id ON planning(employee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planning_date ON planning(date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planning_status ON planning(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planning_created_at ON planning(created_at);

-- Composite indexes for planning queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planning_employee_date ON planning(employee_id, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planning_date_status ON planning(date, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planning_employee_status ON planning(employee_id, status);

-- Time entries table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_employee_id ON time_entries(employee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_status ON time_entries(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_created_at ON time_entries(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_validated_at ON time_entries(validated_at);

-- Composite indexes for time entries queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_employee_date ON time_entries(employee_id, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_date_status ON time_entries(date, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_employee_status ON time_entries(employee_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_date_range ON time_entries(date, employee_id, status);

-- Notifications table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Composite indexes for notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_type_read ON notifications(user_id, type, is_read);

-- Departments table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_created_at ON departments(created_at);

-- Blacklisted tokens table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blacklisted_tokens_token ON blacklisted_tokens(token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blacklisted_tokens_expires_at ON blacklisted_tokens(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blacklisted_tokens_user_id ON blacklisted_tokens(user_id);

-- Sessions table indexes (si utilisé)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_sid ON sessions(sid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- ============================================================================
-- PARTIAL INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Index only for active employees
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_active_only ON employees(id, first_name, last_name) WHERE is_active = true;

-- Index only for unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- Index only for published planning
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planning_published ON planning(employee_id, date) WHERE status = 'published';

-- Index only for submitted/validated time entries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_processed ON time_entries(employee_id, date) WHERE status IN ('submitted', 'validated');

-- ============================================================================
-- EXPRESSION INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Index for overtime calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_overtime ON time_entries(employee_id, date, overtime_hours) WHERE overtime_hours > 0;

-- Index for date ranges (monthly, weekly aggregations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_month ON time_entries(employee_id, date_trunc('month', date), worked_hours);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_week ON time_entries(employee_id, date_trunc('week', date), worked_hours);

-- Index for planning conflicts detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planning_conflicts ON planning(date, start_time, end_time) WHERE status = 'published';

-- ============================================================================
-- ANALYZE TABLES AFTER INDEX CREATION
-- ============================================================================

ANALYZE users;
ANALYZE employees;
ANALYZE departments;
ANALYZE planning;
ANALYZE time_entries;
ANALYZE notifications;
ANALYZE blacklisted_tokens;