-- Old unbound sessions stay empty; compatible with databases that already applied a session-binding migration, and existing bindings are not changed.
ALTER TABLE admin_sessions
  ADD COLUMN IF NOT EXISTS auth_method text CHECK (auth_method IN ('password', 'feishu')),
  ADD COLUMN IF NOT EXISTS auth_binding text,
  ADD COLUMN IF NOT EXISTS auth_claims jsonb;
