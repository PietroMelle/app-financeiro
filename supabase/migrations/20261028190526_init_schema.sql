-- Categorias e transações (spec Q11, Q15, Q17, Q18, Q21)

create table public.categories (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 50),
  kind text not null check (kind in ('income', 'expense')),
  -- Orçamento: limite fixo mensal, só para despesas (Q15)
  monthly_limit numeric(12, 2) check (monthly_limit > 0),
  created_at timestamptz not null default now(),
  constraint categories_limit_only_expense check (monthly_limit is null or kind = 'expense'),
  -- Alvo da FK composta de transactions
  constraint categories_id_user_kind_key unique (id, user_id, kind)
);

create unique index categories_user_name_key on public.categories (user_id, lower(btrim(name)));

create table public.transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id bigint,
  kind text not null check (kind in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  occurred_on date not null default current_date,
  description text check (char_length(description) <= 200),
  created_at timestamptz not null default now(),
  -- Mesma pessoa e mesmo tipo da categoria; apagar a categoria só limpa category_id (Q18)
  constraint transactions_category_fkey foreign key (category_id, user_id, kind)
    references public.categories (id, user_id, kind) on delete set null (category_id)
);

create index transactions_user_occurred_on_idx on public.transactions (user_id, occurred_on desc);
create index transactions_category_id_idx on public.transactions (category_id);

-- RLS: cada linha só é visível e editável pelo dono (Q8)
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy categories_select on public.categories for select to authenticated
  using ((select auth.uid()) = user_id);
create policy categories_insert on public.categories for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy categories_update on public.categories for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy categories_delete on public.categories for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy transactions_select on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy transactions_insert on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy transactions_update on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy transactions_delete on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.categories, public.transactions from anon;

-- Categorias iniciais ao criar o usuário (Q17)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (user_id, name, kind)
  values
    (new.id, 'Mercado', 'expense'),
    (new.id, 'Moradia', 'expense'),
    (new.id, 'Transporte', 'expense'),
    (new.id, 'Saúde', 'expense'),
    (new.id, 'Lazer', 'expense'),
    (new.id, 'Educação', 'expense'),
    (new.id, 'Outros', 'expense'),
    (new.id, 'Salário', 'income');
  return new;
end;
$$;

revoke execute on function private.seed_default_categories() from public, anon, authenticated;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function private.seed_default_categories();
