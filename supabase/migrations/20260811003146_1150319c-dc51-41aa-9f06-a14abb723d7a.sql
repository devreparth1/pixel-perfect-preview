CREATE TABLE public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  category text not null default 'Other',
  quantity text not null default '',
  purchased boolean not null default false,
  source_plan_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grocery_items TO authenticated;
GRANT ALL ON public.grocery_items TO service_role;

ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY grocery_items_own ON public.grocery_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX grocery_items_user_idx ON public.grocery_items (user_id, purchased);

CREATE TRIGGER grocery_items_set_updated_at
  BEFORE UPDATE ON public.grocery_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX grocery_items_user_name_idx ON public.grocery_items (user_id, lower(name));