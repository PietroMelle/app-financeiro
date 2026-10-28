-- Índice cobrindo a FK composta (category_id, user_id, kind)
create index transactions_category_fkey_idx on public.transactions (category_id, user_id, kind);
