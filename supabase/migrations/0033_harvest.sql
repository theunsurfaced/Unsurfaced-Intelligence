-- ==================================================================
-- 0033_harvest.sql  (EX5 · HARVEST)
-- Two things the read needs that only the database can hold:
--   1. source_tiers: the house's judgment of outlets, by domain. A row wins
--      over the tier a rail or the lake guessed (SEAM:EXC_TIERS). T0 is a
--      primary record (a filing, a statistics office), T1 a newsroom or a
--      research house, T2 trade press and reference, T3 blogs, platforms
--      and press releases, T4 aggregators. Edit freely; the worker reloads
--      every hour.
--   2. door_reads: the overnight reads behind the door's tiles, one row per
--      frame per night, kept, so the door can say what changed since last
--      night (SEAM:EXC_DOOR).
-- Service-role only. Run once in the Supabase SQL editor. Idempotent.
-- ==================================================================

create table if not exists public.source_tiers (
  domain      text primary key,
  tier        smallint not null check (tier between 0 and 4),
  name        text,
  kind        text,
  updated_at  timestamptz not null default now()
);
alter table public.source_tiers enable row level security;
revoke all on public.source_tiers from anon, authenticated;

insert into public.source_tiers (domain, tier, name, kind) values
  -- T0: primary records
  ('sec.gov', 0, 'SEC EDGAR', 'filing'), ('census.gov', 0, 'US Census Bureau', 'statistics'), ('bls.gov', 0, 'Bureau of Labor Statistics', 'statistics'),
  ('federalreserve.gov', 0, 'Federal Reserve', 'statistics'), ('ons.gov.uk', 0, 'Office for National Statistics', 'statistics'), ('ec.europa.eu', 0, 'European Commission', 'statistics'),
  ('who.int', 0, 'WHO', 'statistics'), ('cdc.gov', 0, 'CDC', 'statistics'), ('fda.gov', 0, 'FDA', 'regulator'), ('ftc.gov', 0, 'FTC', 'regulator'),
  -- T1: newsrooms and research houses
  ('reuters.com', 1, 'Reuters', 'news'), ('apnews.com', 1, 'Associated Press', 'news'), ('bloomberg.com', 1, 'Bloomberg', 'news'), ('ft.com', 1, 'Financial Times', 'news'),
  ('wsj.com', 1, 'The Wall Street Journal', 'news'), ('nytimes.com', 1, 'The New York Times', 'news'), ('washingtonpost.com', 1, 'The Washington Post', 'news'),
  ('theguardian.com', 1, 'The Guardian', 'news'), ('bbc.com', 1, 'BBC', 'news'), ('bbc.co.uk', 1, 'BBC', 'news'), ('economist.com', 1, 'The Economist', 'news'),
  ('cnbc.com', 1, 'CNBC', 'news'), ('npr.org', 1, 'NPR', 'news'), ('axios.com', 1, 'Axios', 'news'), ('theatlantic.com', 1, 'The Atlantic', 'news'),
  ('mintel.com', 1, 'Mintel', 'research'), ('nielsen.com', 1, 'Nielsen', 'research'), ('nielseniq.com', 1, 'NielsenIQ', 'research'), ('kantar.com', 1, 'Kantar', 'research'),
  ('euromonitor.com', 1, 'Euromonitor', 'research'), ('circana.com', 1, 'Circana', 'research'), ('pewresearch.org', 1, 'Pew Research Center', 'research'),
  ('gallup.com', 1, 'Gallup', 'research'), ('mckinsey.com', 1, 'McKinsey', 'research'), ('bcg.com', 1, 'BCG', 'research'), ('bain.com', 1, 'Bain', 'research'),
  ('hbr.org', 1, 'Harvard Business Review', 'research'), ('nature.com', 1, 'Nature', 'research'), ('science.org', 1, 'Science', 'research'),
  ('ncbi.nlm.nih.gov', 1, 'PubMed', 'research'), ('pubmed.ncbi.nlm.nih.gov', 1, 'PubMed', 'research'), ('jstor.org', 1, 'JSTOR', 'research'),
  ('sciencedirect.com', 1, 'ScienceDirect', 'research'), ('springer.com', 1, 'Springer', 'research'), ('link.springer.com', 1, 'Springer', 'research'),
  ('wiley.com', 1, 'Wiley', 'research'), ('onlinelibrary.wiley.com', 1, 'Wiley', 'research'), ('tandfonline.com', 1, 'Taylor & Francis', 'research'), ('sagepub.com', 1, 'SAGE', 'research'),
  ('journals.sagepub.com', 1, 'SAGE', 'research'), ('nber.org', 1, 'NBER', 'research'), ('statista.com', 2, 'Statista', 'research'),
  -- T2: trade press and reference
  ('wwd.com', 2, 'WWD', 'trade'), ('businessoffashion.com', 2, 'Business of Fashion', 'trade'), ('voguebusiness.com', 2, 'Vogue Business', 'trade'),
  ('happi.com', 2, 'Happi', 'trade'), ('cosmeticsbusiness.com', 2, 'Cosmetics Business', 'trade'), ('cosmeticsdesign.com', 2, 'CosmeticsDesign', 'trade'),
  ('beautyindependent.com', 2, 'Beauty Independent', 'trade'), ('gcimagazine.com', 2, 'GCI', 'trade'), ('beautymatter.com', 2, 'BeautyMatter', 'trade'),
  ('adage.com', 2, 'Ad Age', 'trade'), ('adweek.com', 2, 'Adweek', 'trade'), ('campaignlive.com', 2, 'Campaign', 'trade'), ('campaignlive.co.uk', 2, 'Campaign', 'trade'),
  ('marketingweek.com', 2, 'Marketing Week', 'trade'), ('digiday.com', 2, 'Digiday', 'trade'), ('glossy.co', 2, 'Glossy', 'trade'), ('modernretail.co', 2, 'Modern Retail', 'trade'),
  ('retaildive.com', 2, 'Retail Dive', 'trade'), ('marketingdive.com', 2, 'Marketing Dive', 'trade'), ('fooddive.com', 2, 'Food Dive', 'trade'), ('grocerydive.com', 2, 'Grocery Dive', 'trade'),
  ('footwearnews.com', 2, 'Footwear News', 'trade'), ('sgbonline.com', 2, 'SGB Media', 'trade'), ('retailweek.com', 2, 'Retail Week', 'trade'), ('thegrocer.co.uk', 2, 'The Grocer', 'trade'),
  ('billboard.com', 2, 'Billboard', 'trade'), ('variety.com', 2, 'Variety', 'trade'), ('hollywoodreporter.com', 2, 'The Hollywood Reporter', 'trade'), ('musicbusinessworldwide.com', 2, 'Music Business Worldwide', 'trade'),
  ('techcrunch.com', 2, 'TechCrunch', 'trade'), ('theverge.com', 2, 'The Verge', 'trade'), ('wired.com', 2, 'Wired', 'trade'), ('theinformation.com', 2, 'The Information', 'trade'),
  ('arstechnica.com', 2, 'Ars Technica', 'trade'), ('fastcompany.com', 2, 'Fast Company', 'trade'), ('fortune.com', 2, 'Fortune', 'news'), ('businessinsider.com', 2, 'Business Insider', 'news'),
  ('insider.com', 2, 'Insider', 'news'), ('vogue.com', 2, 'Vogue', 'magazine'), ('allure.com', 2, 'Allure', 'magazine'), ('harpersbazaar.com', 2, 'Harper''s Bazaar', 'magazine'),
  ('elle.com', 2, 'Elle', 'magazine'), ('gq.com', 2, 'GQ', 'magazine'), ('esquire.com', 2, 'Esquire', 'magazine'), ('thecut.com', 2, 'The Cut', 'magazine'),
  ('nymag.com', 2, 'New York Magazine', 'magazine'), ('newyorker.com', 1, 'The New Yorker', 'magazine'), ('time.com', 2, 'Time', 'magazine'), ('forbes.com', 3, 'Forbes', 'news'),
  ('en.wikipedia.org', 2, 'Wikipedia', 'reference'), ('wikipedia.org', 2, 'Wikipedia', 'reference'), ('wikidata.org', 2, 'Wikidata', 'reference'), ('openlibrary.org', 2, 'Open Library', 'reference'),
  ('arxiv.org', 2, 'arXiv', 'preprint'), ('ssrn.com', 2, 'SSRN', 'preprint'), ('papers.ssrn.com', 2, 'SSRN', 'preprint'), ('openalex.org', 2, 'OpenAlex', 'research'),
  -- T3: platforms, blogs, press releases
  ('hypebeast.com', 3, 'Hypebeast', 'blog'), ('highsnobiety.com', 3, 'Highsnobiety', 'blog'), ('complex.com', 3, 'Complex', 'blog'), ('nicekicks.com', 3, 'Nice Kicks', 'blog'),
  ('sneakernews.com', 3, 'Sneaker News', 'blog'), ('solecollector.com', 3, 'Sole Collector', 'blog'), ('engadget.com', 3, 'Engadget', 'blog'), ('mashable.com', 3, 'Mashable', 'blog'),
  ('byrdie.com', 3, 'Byrdie', 'blog'), ('refinery29.com', 3, 'Refinery29', 'blog'), ('popsugar.com', 3, 'Popsugar', 'blog'), ('buzzfeed.com', 3, 'BuzzFeed', 'blog'),
  ('trendhunter.com', 3, 'Trend Hunter', 'blog'), ('linkedin.com', 3, 'LinkedIn', 'platform'), ('medium.com', 4, 'Medium', 'platform'), ('substack.com', 3, 'Substack', 'platform'),
  ('youtube.com', 3, 'YouTube', 'platform'), ('reddit.com', 3, 'Reddit', 'platform'), ('tiktok.com', 3, 'TikTok', 'platform'), ('x.com', 3, 'X', 'platform'), ('twitter.com', 3, 'X', 'platform'),
  ('instagram.com', 3, 'Instagram', 'platform'), ('facebook.com', 3, 'Facebook', 'platform'), ('threads.net', 3, 'Threads', 'platform'), ('bsky.app', 3, 'Bluesky', 'platform'),
  ('news.ycombinator.com', 3, 'Hacker News', 'platform'), ('quora.com', 4, 'Quora', 'platform'), ('pinterest.com', 3, 'Pinterest', 'platform'),
  ('prnewswire.com', 3, 'PR Newswire', 'release'), ('businesswire.com', 3, 'Business Wire', 'release'), ('globenewswire.com', 3, 'GlobeNewswire', 'release'), ('prweb.com', 4, 'PRWeb', 'release'),
  ('einpresswire.com', 4, 'EIN Presswire', 'release'), ('accesswire.com', 4, 'ACCESSWIRE', 'release'),
  -- T4: aggregators and content farms
  ('msn.com', 4, 'MSN', 'aggregator'), ('news.yahoo.com', 4, 'Yahoo News', 'aggregator'), ('yahoo.com', 4, 'Yahoo', 'aggregator'), ('flipboard.com', 4, 'Flipboard', 'aggregator'),
  ('newsbreak.com', 4, 'NewsBreak', 'aggregator'), ('ground.news', 4, 'Ground News', 'aggregator'), ('aol.com', 4, 'AOL', 'aggregator')
on conflict (domain) do update set tier = excluded.tier, name = excluded.name, kind = excluded.kind, updated_at = now();

-- The overnight reads behind the door.
create table if not exists public.door_reads (
  id          uuid primary key default gen_random_uuid(),
  frame_key   text not null,            -- stable key of the frame (theme id or track id)
  night       date not null,            -- the night it was compiled for
  frame       jsonb not null default '{}'::jsonb,
  measures    jsonb not null default '{}'::jsonb,
  read        jsonb,                    -- {read, insights, ideas, brief}
  evidence    jsonb not null default '[]'::jsonb,
  stamp       text,                     -- hash of the evidence it stood on; equal stamp, same read reused
  status      text not null default 'queued' check (status in ('queued','compiling','ready','reused','failed')),
  error       text,
  cost_usd    numeric(12,6),
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists door_reads_frame_night_uq on public.door_reads (frame_key, night);
create index if not exists door_reads_night_idx on public.door_reads (night desc, status);
alter table public.door_reads enable row level security;
revoke all on public.door_reads from anon, authenticated;

-- SEAM:EXC_FACTS: the Claude ledger accepts the `facts` tier (the fact table, Haiku), its own cap beside `frame`.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.claude_jobs'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%tier%'
  loop
    execute format('alter table public.claude_jobs drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.claude_jobs
  add constraint claude_jobs_tier_check check (tier in ('doc', 'ingest', 'live', 'frame', 'facts'));

-- Check: three lines come back.
select 'source_tiers ready' as status, count(*) as domains from public.source_tiers
union all
select 'door_reads ready', 0 where exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'door_reads')
union all
select 'facts tier ledgered', 0 where exists (select 1 from pg_constraint
              where conrelid = 'public.claude_jobs'::regclass and conname = 'claude_jobs_tier_check'
                and pg_get_constraintdef(oid) ilike '%facts%');
