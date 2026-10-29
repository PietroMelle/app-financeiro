-- v3 fatia 0: resgate de meta (Q45), cor e ícone da categoria (Q46) e índice duplicado

-- Resgate: tirar dinheiro de uma meta. Como o guardado, sempre tem meta e nunca categoria.
alter table public.transactions drop constraint transactions_kind_check;
alter table public.transactions
  add constraint transactions_kind_check check (kind in ('income', 'expense', 'saving', 'withdrawal'));

alter table public.transactions drop constraint transactions_saving_goal;
alter table public.transactions
  add constraint transactions_goal_kind check ((kind in ('saving', 'withdrawal')) = (goal_id is not null));

alter table public.transactions drop constraint transactions_saving_no_category;
alter table public.transactions
  add constraint transactions_goal_no_category check (kind not in ('saving', 'withdrawal') or category_id is null);

-- Cor (posição 1–8 da paleta) e ícone escolhidos pela pessoa; null = automático.
alter table public.categories
  add column color smallint check (color between 1 and 8),
  add column icon text check (icon ~ '^[a-z]{2,20}$');

-- Coberto por transactions_category_fkey_idx (category_id, user_id, kind).
drop index if exists public.transactions_category_id_idx;
