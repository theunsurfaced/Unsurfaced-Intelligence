-- 0024_read_ledger_desk.sql
-- SEAM:READ_LEDGER + SEAM:DESK — every read persists; the pulse thinks for the house.
-- Run once in the Supabase SQL editor. Idempotent.

-- 1. READS: every compiled read, persisted.
create table if not exists public.reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  query text not null,
  query_hash text not null,
  cls text null,
  mode text null,
  read text[] null,
  brief text null,
  insights jsonb not null default '[]'::jsonb,
  ideas jsonb not null default '[]'::jsonb,
  connectors jsonb not null default '[]'::jsonb,
  evidence_n int not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists reads_query_hash_idx on public.reads (query_hash, created_at desc);
create index if not exists reads_created_idx on public.reads (created_at desc);
alter table public.reads enable row level security;
drop policy if exists reads_owner_select on public.reads;
create policy reads_owner_select on public.reads for select using (auth.uid() = user_id);
-- service role bypasses RLS; the worker writes with the service key.

-- 2. HOUSE_FOCUS: the desk's steering wheel. weight 0 excludes a territory.
create table if not exists public.house_focus (
  territory text primary key,
  weight numeric(4,2) not null default 1.0,
  note text null,
  updated_at timestamptz not null default now()
);
insert into public.house_focus (territory, weight) values
  ('advertising-marketing', 1.4), ('technology-innovation', 1.0), ('artificial-intelligence', 1.1),
  ('business-economics', 1.0), ('entrepreneurship-creator', 1.3), ('music', 1.2), ('fashion-beauty', 1.3),
  ('sneakers-streetwear', 1.3), ('art-design', 1.1), ('architecture-cities', 0.8),
  ('entertainment-gaming', 1.1), ('food-hospitality', 1.0), ('sustainability-impact', 0.9), ('global-diaspora', 1.0)
on conflict (territory) do nothing;
alter table public.house_focus enable row level security;
drop policy if exists house_focus_read on public.house_focus;
create policy house_focus_read on public.house_focus for select using (true);

-- 3. TRACKS: entities the house follows. Seeded with the nineteen brands the Brands page carried by hand.
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid null,
  name text not null,
  kind text not null default 'brand',
  aliases text[] not null default '{}'::text[],
  sector text null,
  description text null,
  query text null,
  kg_id text null,
  wikidata_qid text null,
  image text null,
  image_license text null,
  active boolean not null default true,
  created_by uuid null,
  created_at timestamptz not null default now()
);
create unique index if not exists tracks_name_kind_idx on public.tracks (lower(name), kind);
insert into public.tracks (name, kind, aliases, sector, description, query) values
  ('Nike', 'brand', ARRAY['NKE']::text[], 'Lifestyle & Apparel', 'Athletic footwear, apparel & equipment', 'Nike brand consumer perception athletic apparel marketing strategy'),
  ('Jordan Brand', 'brand', ARRAY['JB']::text[], 'Lifestyle & Apparel', 'Premium athletic & streetwear', 'Jordan Brand consumer culture streetwear brand equity sneaker market'),
  ('Walmart', 'brand', ARRAY['WMT']::text[], 'Retail', 'Mass-market retail & e-commerce', 'Walmart consumer trust retail brand perception value positioning strategy'),
  ('Costco', 'brand', ARRAY['COST']::text[], 'Retail', 'Membership warehouse retail', 'Costco consumer loyalty membership retail brand trust value perception'),
  ('Robinhood', 'brand', ARRAY['HOOD']::text[], 'Finance', 'Retail investing & fintech', 'Robinhood brand trust fintech consumer perception retail investing market'),
  ('Apple', 'brand', ARRAY['AAPL']::text[], 'Technology', 'Consumer technology & ecosystem', 'Apple brand equity consumer trust technology ecosystem marketing strategy'),
  ('Nvidia', 'brand', ARRAY['NVDA']::text[], 'Technology', 'AI chips & computing infrastructure', 'Nvidia brand consumer perception AI technology market positioning brand equity'),
  ('Microsoft', 'brand', ARRAY['MSFT']::text[], 'Technology', 'Enterprise software, cloud & AI', 'Microsoft brand consumer enterprise perception AI cloud brand strategy equity'),
  ('Meta', 'brand', ARRAY['META']::text[], 'Technology', 'Social platforms & AR/VR', 'Meta Facebook brand trust consumer perception social media brand health'),
  ('Patagonia', 'brand', ARRAY['PAT']::text[], 'Lifestyle & Apparel', 'Outdoor gear & environmental advocacy', 'Patagonia brand trust sustainability consumer values environmental advocacy'),
  ('Lululemon', 'brand', ARRAY['LULU']::text[], 'Lifestyle & Apparel', 'Premium activewear & community', 'Lululemon brand consumer loyalty activewear premium community brand equity'),
  ('Spotify', 'brand', ARRAY['SPOT']::text[], 'Media & Entertainment', 'Audio streaming & creator platform', 'Spotify brand consumer loyalty audio streaming creator economy platform'),
  ('Netflix', 'brand', ARRAY['NFLX']::text[], 'Media & Entertainment', 'Streaming & entertainment', 'Netflix brand consumer streaming entertainment brand trust loyalty'),
  ('OpenAI', 'brand', ARRAY['OAI']::text[], 'Technology', 'AI research & products', 'OpenAI brand consumer trust AI technology ChatGPT perception brand health'),
  ('Glossier', 'brand', ARRAY['GLS']::text[], 'Lifestyle & Apparel', 'DTC beauty & community', 'Glossier brand DTC beauty consumer trust community brand health perception'),
  ('Duolingo', 'brand', ARRAY['DUOL']::text[], 'Media & Entertainment', 'Edtech & gamified learning', 'Duolingo brand consumer engagement education marketing brand equity culture'),
  ('Target', 'brand', ARRAY['TGT']::text[], 'Retail', 'Mass-market retail & branded experience', 'Target brand consumer trust retail experience brand equity marketing strategy'),
  ('Visa', 'brand', ARRAY['V']::text[], 'Finance', 'Global payments infrastructure & brand', 'Visa brand consumer trust payments fintech digital financial brand equity'),
  ('Starbucks', 'brand', ARRAY['SBUX']::text[], 'Lifestyle & Apparel', 'Coffee, community & loyalty ecosystem', 'Starbucks brand consumer loyalty coffee experience brand trust perception')
on conflict do nothing;
alter table public.tracks enable row level security;
drop policy if exists tracks_read on public.tracks;
create policy tracks_read on public.tracks for select using (true);

-- 4. PULSE_ITEMS: every line the desk ever published, with its components.
create table if not exists public.pulse_items (
  id uuid primary key default gen_random_uuid(),
  edition_date date not null,
  cluster_id uuid null,
  lens text not null,
  territory text null,
  state text null,
  line text not null,
  title text null,
  url text null,
  source_name text null,
  published_at timestamptz null,
  image text null,
  score numeric(6,3) not null default 0,
  components jsonb not null default '{}'::jsonb,
  breaking boolean not null default false,
  entered_at timestamptz not null default now(),
  expires_at timestamptz null
);
create index if not exists pulse_items_edition_idx on public.pulse_items (edition_date desc, score desc);
alter table public.pulse_items enable row level security;
drop policy if exists pulse_items_read on public.pulse_items;
create policy pulse_items_read on public.pulse_items for select using (true);
