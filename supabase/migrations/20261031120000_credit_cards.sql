-- Cartão de crédito, faturas e parcelas (spec Q56 a Q61)

-- Q56: cartão é um tipo de conta, com fechamento, vencimento e limite opcional.
alter table public.accounts drop constraint accounts_type_check;
alter table public.accounts
  add constraint accounts_type_check check (type in ('wallet', 'checking', 'savings', 'other', 'credit'));

alter table public.accounts
  add column closing_day smallint check (closing_day between 1 and 31),
  add column due_day smallint check (due_day between 1 and 31),
  add column credit_limit numeric(12, 2) check (credit_limit > 0);

-- Cartão sempre tem fechamento e vencimento; as outras contas não têm nem limite.
alter table public.accounts
  add constraint accounts_credit_shape check (
    case
      when type = 'credit' then closing_day is not null and due_day is not null
      else closing_day is null and due_day is null and credit_limit is null
    end
  );

-- Q60: parcelas da mesma compra dividem o mesmo grupo; número de 1 até o total (2 a 48).
alter table public.transactions
  add column installment_group uuid,
  add column installment_number smallint,
  add column installment_count smallint;

alter table public.transactions
  add constraint transactions_installment_shape check (
    (installment_group is null and installment_number is null and installment_count is null)
    or (
      installment_group is not null
      and installment_count between 2 and 48
      and installment_number between 1 and installment_count
      and kind = 'expense'
    )
  );

-- "Apagar a compra toda" busca as parcelas pelo grupo.
create index transactions_installment_group_idx on public.transactions (installment_group)
  where installment_group is not null;
