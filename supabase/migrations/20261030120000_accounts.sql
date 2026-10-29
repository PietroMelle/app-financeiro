-- Contas e saldo total (spec Q48 a Q55)

create table public.accounts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  type text not null check (type in ('wallet', 'checking', 'savings', 'other')),
  -- Saldo no dia do cadastro; pode ser negativo (cheque especial)
  initial_balance numeric(12, 2) not null default 0,
  color smallint check (color between 1 and 8),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  -- Alvo das FKs compostas de transactions e recurrences
  constraint accounts_id_user_key unique (id, user_id)
);

create unique index accounts_user_name_key on public.accounts (user_id, lower(btrim(name)));
-- No máximo uma conta padrão por pessoa (Q50)
create unique index accounts_one_default_key on public.accounts (user_id) where is_default;

alter table public.accounts enable row level security;

create policy accounts_select on public.accounts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy accounts_insert on public.accounts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy accounts_update on public.accounts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy accounts_delete on public.accounts for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.accounts from anon;

-- Q49: "Carteira" padrão para quem já existe...
insert into public.accounts (user_id, name, type, is_default)
select id, 'Carteira', 'wallet', true from auth.users;

-- ...e para quem criar a conta daqui para frente.
create function private.seed_default_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.accounts (user_id, name, type, is_default) values (new.id, 'Carteira', 'wallet', true);
  return new;
end;
$$;

revoke execute on function private.seed_default_account() from public, anon, authenticated;

create trigger on_auth_user_created_seed_account
  after insert on auth.users
  for each row execute function private.seed_default_account();

-- Lançamentos: conta de origem e, na transferência (Q52), conta de destino.
-- Apagar uma conta com lançamentos é bloqueado: o app pede para mover antes.
alter table public.transactions
  add column account_id bigint,
  add column to_account_id bigint;

alter table public.transactions
  add constraint transactions_account_fkey foreign key (account_id, user_id)
    references public.accounts (id, user_id),
  add constraint transactions_to_account_fkey foreign key (to_account_id, user_id)
    references public.accounts (id, user_id);

update public.transactions t
set account_id = a.id
from public.accounts a
where a.user_id = t.user_id and a.is_default and t.kind in ('income', 'expense');

alter table public.transactions drop constraint transactions_kind_check;
alter table public.transactions
  add constraint transactions_kind_check check (kind in ('income', 'expense', 'saving', 'withdrawal', 'transfer'));

-- Q53: guardado e resgate são reserva, sem conta; os outros tipos sempre têm conta.
alter table public.transactions
  add constraint transactions_account_kind check ((kind in ('saving', 'withdrawal')) = (account_id is null));

-- Transferência: destino diferente da origem e sem categoria; os outros tipos, sem destino.
alter table public.transactions
  add constraint transactions_transfer_shape check (
    case
      when kind = 'transfer' then to_account_id is not null and to_account_id <> account_id and category_id is null
      else to_account_id is null
    end
  );

create index transactions_account_fkey_idx on public.transactions (account_id, user_id) where account_id is not null;
create index transactions_to_account_fkey_idx on public.transactions (to_account_id, user_id) where to_account_id is not null;

-- Recorrentes (Q55): conta opcional; sem conta (ou conta apagada) o app usa a padrão.
alter table public.recurrences add column account_id bigint;
alter table public.recurrences
  add constraint recurrences_account_fkey foreign key (account_id, user_id)
    references public.accounts (id, user_id) on delete set null (account_id);

update public.recurrences r
set account_id = a.id
from public.accounts a
where a.user_id = r.user_id and a.is_default;

create index recurrences_account_fkey_idx on public.recurrences (account_id, user_id) where account_id is not null;

-- Q51: saldo atual de cada conta. security_invoker: a view respeita o RLS de quem consulta.
create view public.account_balances with (security_invoker = true) as
select
  a.id as account_id,
  a.initial_balance
    + coalesce((
      select sum(case t.kind when 'income' then t.amount else -t.amount end)
      from public.transactions t
      where t.account_id = a.id
    ), 0)
    + coalesce((
      select sum(t.amount)
      from public.transactions t
      where t.to_account_id = a.id
    ), 0) as balance
from public.accounts a;

revoke all on public.account_balances from anon;
grant select on public.account_balances to authenticated;
