-- Step 1: Add status_changed_at column to projects
ALTER TABLE projects
    ADD COLUMN status_changed_at timestamptz not null default now();

-- Step 2: Backfill status_changed_at from created_at for existing rows
UPDATE projects SET status_changed_at = created_at;

-- Step 3: Create project_status_events history table
CREATE TABLE project_status_events (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_status project_status,
    to_status   project_status NOT NULL,
    changed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON project_status_events (project_id, changed_at);

-- Step 4: Backfill one creation event per existing project
INSERT INTO project_status_events (project_id, user_id, from_status, to_status, changed_at)
SELECT id, user_id, null, status, created_at FROM projects;

-- Step 5: RLS on project_status_events — SELECT only; trigger writes rows
ALTER TABLE project_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project status events"
    ON project_status_events FOR SELECT
    USING (auth.uid() = user_id);

GRANT SELECT ON project_status_events TO authenticated;

-- Step 6: BEFORE UPDATE trigger — stamp status_changed_at when status changes
CREATE OR REPLACE FUNCTION public.stamp_project_status_changed_at()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = public
AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.status_changed_at := now();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_projects_stamp_status_changed_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION public.stamp_project_status_changed_at();

-- Step 7: AFTER INSERT OR UPDATE trigger — write history rows
CREATE OR REPLACE FUNCTION public.record_project_status_event()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.project_status_events (project_id, user_id, from_status, to_status)
        VALUES (NEW.id, NEW.user_id, null, NEW.status);
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO public.project_status_events (project_id, user_id, from_status, to_status)
        VALUES (NEW.id, NEW.user_id, OLD.status, NEW.status);
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_projects_record_status_event
    AFTER INSERT OR UPDATE OF status ON projects
    FOR EACH ROW EXECUTE FUNCTION public.record_project_status_event();
