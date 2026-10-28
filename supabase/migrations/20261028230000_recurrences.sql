-- Lançamentos recorrentes mensais (spec Q35, Q36)

create table public.recurrences (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id bigint,
  kind text not null check (kind in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  description text not null check (char_length(btrim(description)) between 1 and 200),
  -- Dia 29 a 31 cai no último dia dos meses mais curtos
  day_of_month smallint not null check (day_of_month between 1 and 31),
  -- Vale do mês de starts_on até o mês de ends_on (opcional, Q36)
  starts_on date not null default current_date,
  ends_on date,
  created_at timestamptz not null default now(),
  constraint recurrences_period check (ends_on is null or ends_on >= starts_on),
  -- Alvo da FK composta de transactions
  constraint recurrences_id_user_key unique (id, user_id),
  constraint recurrences_category_fkey foreign key (category_id, user_id, kind)
    references public.categories (id, user_id, kind) on delete set null (category_id)
);

create index recurrences_user_idx on public.recurrences (user_id);
create index recurrences_category_fkey_idx on public.recurrences (category_id, user_id, kind);

-- Confirmar um previsto cria uma transação ligada à recorrente.
-- Apagar a recorrente mantém o histórico e só desfaz a ligação.
alter table public.transactions add column recurrence_id bigint;
alter table public.transactions
  add constraint transactions_recurrence_fkey foreign key (recurrence_id, user_id)
    references public.recurrences (id, user_id) on delete set null (recurrence_id);

-- No máximo uma confirmação por recorrente em cada mês (também cobre a FK)
create unique index transactions_recurrence_month_key
  on public.transactions (recurrence_id, user_id, (date_trunc('month', occurred_on::timestamp)))
  where recurrence_id is not null;

alter table public.recurrences enable row level security;

create policy recurrences_select on public.recurrences for select to authenticated
  using ((select auth.uid()) = user_id);
create policy recurrences_insert on public.recurrences for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy recurrences_update on public.recurrences for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy recurrences_delete on public.recurrences for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.recurrences from anon;
