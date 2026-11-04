-- Admin sessions can also come from password sign-in (ADMIN_PASSWORD), not only Feishu; databases that already allow both are unaffected.
ALTER TABLE admin_sessions DROP CONSTRAINT IF EXISTS admin_sessions_auth_method_check;
ALTER TABLE admin_sessions ADD CONSTRAINT admin_sessions_auth_method_check CHECK (auth_method IN ('password', 'feishu'));
