-- ============================================================================
-- OPTIONAL CLEAN-UP (run AFTER schema.sql)
-- Earlier versions of CognitiveAdapt stored PLAINTEXT passwords in public.users
-- and used "allow everything" policies, so anyone holding the project's anon
-- key could read every account. This removes those legacy tables.
-- DESTRUCTIVE: export anything you need first (Table Editor -> Export CSV).
-- ============================================================================
drop table if exists public.interaction_events cascade;
drop table if exists public.learning_sessions   cascade;
drop table if exists public.users               cascade;
