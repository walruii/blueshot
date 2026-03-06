GRANT ALL ON TABLE message TO anon;
GRANT ALL ON TABLE message TO authenticated;
GRANT ALL ON TABLE message TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime'
		AND schemaname = 'public'
		AND tablename = 'message'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE message;
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime'
		AND schemaname = 'public'
		AND tablename = 'conversation'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE conversation;
	END IF;
END $$;
