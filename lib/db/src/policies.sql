-- Row Level Security for the comebackapp tables.
--
-- `drizzle-kit push` reconciles tables, indexes and enums but not policies,
-- triggers or functions, so these live here and are applied by `pnpm seed`.
-- Every statement is idempotent and safe to re-run.
--
-- Spec: refactor-comeback-app.md § 5.7 (privacy).

-- ---------------------------------------------------------------------------
-- § 5.7 — RLS as defence in depth. The Express API is the only client and
-- already scopes every query by the authenticated user; these policies mean a
-- leaked anon key still cannot read another user's rows.
-- ---------------------------------------------------------------------------

ALTER TABLE comebackapp.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comebackapp.lists        ENABLE ROW LEVEL SECURITY;
ALTER TABLE comebackapp.tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE comebackapp.task_types   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_owner ON comebackapp.user_profiles;
CREATE POLICY user_profiles_owner ON comebackapp.user_profiles
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS lists_owner ON comebackapp.lists;
CREATE POLICY lists_owner ON comebackapp.lists
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS tasks_owner ON comebackapp.tasks;
CREATE POLICY tasks_owner ON comebackapp.tasks
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Seed data: world-readable, write-restricted to the service role.
DROP POLICY IF EXISTS task_types_readable ON comebackapp.task_types;
CREATE POLICY task_types_readable ON comebackapp.task_types
  FOR SELECT USING (true);
