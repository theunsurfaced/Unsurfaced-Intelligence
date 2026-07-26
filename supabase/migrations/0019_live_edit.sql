-- 0019_live_edit.sql — SEAM:LIVE_EDIT (DB side). Idempotent.
-- Stable-id question upserts need a partner UPDATE door on study_question;
-- without it a PATCH silently updates zero rows (the RLS no-op trap).
drop policy if exists study_question_partner_update on public.study_question;
create policy study_question_partner_update on public.study_question
  for update using (
    exists (select 1 from public.study s join public.partner_profile pp on pp.id = s.partner_id
            where s.id = study_question.study_id and pp.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.study s join public.partner_profile pp on pp.id = s.partner_id
            where s.id = study_question.study_id and pp.owner_id = auth.uid())
  );
