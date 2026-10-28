-- Metas e dinheiro guardado (spec Q37)

create table public.goals (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  target_amount numeric(12, 2) not null check (target_amount > 0),
  -- Prazo opcional: último dia do mês escolhido
  deadline date,
  created_at timestamptz not null default now(),
  -- Alvo da FK composta de transactions
  constraint goals_id_user_key unique (id, user_id)
);

create index goals_user_idx on public.goals (user_id);

-- "Guardado" é um terceiro tipo de movimento: não é despesa, mas sai do disponível.
alter table public.transactions drop constraint transactions_kind_check;
alter table public.transactions
  add constraint transactions_kind_check check (kind in ('income', 'expense', 'saving'));

alter table public.transactions add column goal_id bigint;
-- Apagar a meta apaga o que foi guardado nela (o app avisa antes).
alter table public.transactions
  add constraint transactions_goal_fkey foreign key (goal_id, user_id)
    references public.goals (id, user_id) on delete cascade;

-- Guardado sempre tem meta e nunca categoria; os outros tipos nunca têm meta.
alter table public.transactions
  add constraint transactions_saving_goal check ((kind = 'saving') = (goal_id is not null));
alter table public.transactions
  add constraint transactions_saving_no_category check (kind <> 'saving' or category_id is null);

create index transactions_goal_fkey_idx on public.transactions (goal_id, user_id) where goal_id is not null;

alter table public.goals enable row level security;

create policy goals_select on public.goals for select to authenticated
  using ((select auth.uid()) = user_id);
create policy goals_insert on public.goals for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy goals_update on public.goals for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy goals_delete on public.goals for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.goals from anon;
