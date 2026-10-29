-- Testes de RLS e integridade (spec Q8, Q15, Q17, Q18, Q35–Q37, Q45, Q46, Q48–Q53).
-- Roda numa transação desfeita no final: não deixa dados no banco.
-- Uso: colar no SQL Editor do Supabase, ou psql -f. Termina com 'ok' ou com o erro do caso que falhou.

begin;

insert into auth.users (id, aud, role, email)
values
  ('00000000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'b@test.local');

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  b constant uuid := '00000000-0000-0000-0000-00000000000b';
  a_mercado bigint;
  a_salario bigint;
  b_mercado bigint;
  a_wallet bigint;
  a_bank bigint;
  b_wallet bigint;
  a_tx bigint;
  a_rec bigint;
  a_goal bigint;
  n int;
  money numeric;
begin
  select id into a_mercado from public.categories where user_id = a and name = 'Mercado';
  select id into a_salario from public.categories where user_id = a and name = 'Salário';
  select id into b_mercado from public.categories where user_id = b and name = 'Mercado';
  select id into a_wallet from public.accounts where user_id = a and is_default;
  select id into b_wallet from public.accounts where user_id = b and is_default;

  -- Q17: categorias iniciais criadas pelo trigger
  select count(*) into n from public.categories where user_id = a;
  if n <> 8 then raise exception 'seed: esperava 8 categorias, veio %', n; end if;

  -- Q49: conta "Carteira" padrão criada pelo trigger
  select count(*) into n from public.accounts where user_id = a and name = 'Carteira' and is_default;
  if n <> 1 then raise exception 'seed: esperava a Carteira padrão, veio %', n; end if;

  -- A partir daqui, age como o usuário A
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  select count(*) into n from public.categories;
  if n <> 8 then raise exception 'rls: A deveria ver só as próprias 8 categorias, viu %', n; end if;
  select count(*) into n from public.accounts;
  if n <> 1 then raise exception 'rls: A deveria ver só a própria conta, viu %', n; end if;

  insert into public.transactions (category_id, kind, amount, description, account_id)
  values (a_mercado, 'expense', 12.50, 'pão', a_wallet) returning id into a_tx;

  -- Q50: receita e despesa exigem conta
  begin
    insert into public.transactions (kind, amount) values ('expense', 1);
    raise exception 'check: despesa sem conta aceita';
  exception when check_violation then null;
  end;

  -- A não usa conta nem categoria de B
  begin
    insert into public.transactions (kind, amount, account_id) values ('expense', 1, b_wallet);
    raise exception 'fk: A conseguiu usar conta de B';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.transactions (category_id, kind, amount, account_id) values (b_mercado, 'expense', 1, a_wallet);
    raise exception 'fk: A conseguiu usar categoria de B';
  exception when foreign_key_violation then null;
  end;

  -- A não grava linha em nome de B
  begin
    insert into public.transactions (user_id, kind, amount, account_id) values (b, 'expense', 1, a_wallet);
    raise exception 'rls: A conseguiu inserir como B';
  exception when insufficient_privilege or foreign_key_violation then null;
  end;

  -- A não altera nem apaga categoria de B
  update public.categories set name = 'hack' where id = b_mercado;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'rls: A alterou categoria de B'; end if;
  delete from public.categories where id = b_mercado;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'rls: A apagou categoria de B'; end if;

  -- Despesa não entra em categoria de receita
  begin
    insert into public.transactions (category_id, kind, amount, account_id) values (a_salario, 'expense', 1, a_wallet);
    raise exception 'fk: despesa aceita em categoria de receita';
  exception when foreign_key_violation then null;
  end;

  -- Q15: limite só em categoria de despesa
  begin
    update public.categories set monthly_limit = 100 where id = a_salario;
    raise exception 'check: limite aceito em categoria de receita';
  exception when check_violation then null;
  end;

  -- Valor precisa ser positivo
  begin
    insert into public.transactions (kind, amount, account_id) values ('expense', 0, a_wallet);
    raise exception 'check: valor zero aceito';
  exception when check_violation then null;
  end;

  -- Q48/Q52: segunda conta e transferência
  insert into public.accounts (name, type, initial_balance) values ('Banco', 'checking', 1000) returning id into a_bank;
  begin
    insert into public.accounts (name, type) values ('banco ', 'savings');
    raise exception 'unique: nome de conta repetido aceito';
  exception when unique_violation then null;
  end;
  begin
    insert into public.accounts (name, type, is_default) values ('Outra', 'other', true);
    raise exception 'unique: duas contas padrão aceitas';
  exception when unique_violation then null;
  end;

  insert into public.transactions (kind, amount, account_id, to_account_id) values ('transfer', 300, a_bank, a_wallet);
  begin
    insert into public.transactions (kind, amount, account_id) values ('transfer', 1, a_bank);
    raise exception 'check: transferência sem destino aceita';
  exception when check_violation then null;
  end;
  begin
    insert into public.transactions (kind, amount, account_id, to_account_id) values ('transfer', 1, a_bank, a_bank);
    raise exception 'check: transferência para a mesma conta aceita';
  exception when check_violation then null;
  end;
  begin
    insert into public.transactions (kind, amount, account_id, to_account_id) values ('expense', 1, a_bank, a_wallet);
    raise exception 'check: despesa com destino aceita';
  exception when check_violation then null;
  end;

  -- Q51: saldo = inicial + entradas − saídas (Banco: 1000 − 300; Carteira: 0 − 12,50 + 300)
  select balance into money from public.account_balances where account_id = a_bank;
  if money <> 700 then raise exception 'saldo: Banco deveria ter 700, tem %', money; end if;
  select balance into money from public.account_balances where account_id = a_wallet;
  if money <> 287.50 then raise exception 'saldo: Carteira deveria ter 287,50, tem %', money; end if;

  -- Conta com lançamentos não pode ser apagada
  begin
    delete from public.accounts where id = a_bank;
    raise exception 'fk: conta com lançamentos foi apagada';
  exception when foreign_key_violation then null;
  end;

  -- Q35/Q36: recorrentes
  insert into public.recurrences (category_id, kind, amount, description, day_of_month, account_id)
  values (a_mercado, 'expense', 50, 'feira', 10, a_wallet) returning id into a_rec;

  -- Uma confirmação por mês
  insert into public.transactions (kind, amount, occurred_on, recurrence_id, account_id) values ('expense', 50, '2026-10-10', a_rec, a_wallet);
  begin
    insert into public.transactions (kind, amount, occurred_on, recurrence_id, account_id) values ('expense', 50, '2026-10-20', a_rec, a_wallet);
    raise exception 'unique: duas confirmações no mesmo mês';
  exception when unique_violation then null;
  end;
  insert into public.transactions (kind, amount, occurred_on, recurrence_id, account_id) values ('expense', 50, '2026-11-10', a_rec, a_wallet);

  begin
    insert into public.recurrences (kind, amount, description, day_of_month) values ('expense', 1, 'x', 32);
    raise exception 'check: dia 32 aceito';
  exception when check_violation then null;
  end;

  -- Age como B: não vê recorrente nem contas de A, e não confirma em nome dela
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.recurrences;
  if n <> 0 then raise exception 'rls: B viu recorrente de A'; end if;
  select count(*) into n from public.account_balances where account_id in (a_wallet, a_bank);
  if n <> 0 then raise exception 'rls: B viu saldo das contas de A'; end if;
  begin
    insert into public.transactions (kind, amount, recurrence_id, account_id) values ('expense', 1, a_rec, b_wallet);
    raise exception 'fk: B confirmou recorrente de A';
  exception when foreign_key_violation then null;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  -- Apagar a recorrente mantém as confirmações, só desfaz a ligação
  delete from public.recurrences where id = a_rec;
  select count(*) into n from public.transactions where amount = 50 and recurrence_id is null;
  if n <> 2 then raise exception 'recorrente: confirmações não ficaram no histórico (%)', n; end if;

  -- Q37: metas e guardado (Q53: sem conta)
  insert into public.goals (name, target_amount) values ('viagem', 1000) returning id into a_goal;
  insert into public.transactions (kind, amount, goal_id) values ('saving', 100, a_goal);

  begin
    insert into public.transactions (kind, amount) values ('saving', 1);
    raise exception 'check: guardado sem meta aceito';
  exception when check_violation then null;
  end;
  begin
    insert into public.transactions (kind, amount, goal_id, account_id) values ('expense', 1, a_goal, a_wallet);
    raise exception 'check: despesa com meta aceita';
  exception when check_violation then null;
  end;
  begin
    insert into public.transactions (kind, amount, goal_id, category_id) values ('saving', 1, a_goal, a_salario);
    raise exception 'check: guardado com categoria aceito';
  exception when check_violation then null;
  end;
  begin
    insert into public.transactions (kind, amount, goal_id, account_id) values ('saving', 1, a_goal, a_wallet);
    raise exception 'check: guardado com conta aceito';
  exception when check_violation then null;
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.goals;
  if n <> 0 then raise exception 'rls: B viu meta de A'; end if;
  begin
    insert into public.transactions (kind, amount, goal_id) values ('saving', 1, a_goal);
    raise exception 'fk: B guardou na meta de A';
  exception when foreign_key_violation then null;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  -- Q45: resgate também exige meta e não aceita categoria
  insert into public.transactions (kind, amount, goal_id) values ('withdrawal', 40, a_goal);
  begin
    insert into public.transactions (kind, amount) values ('withdrawal', 1);
    raise exception 'check: resgate sem meta aceito';
  exception when check_violation then null;
  end;
  begin
    insert into public.transactions (kind, amount, goal_id, category_id) values ('withdrawal', 1, a_goal, a_salario);
    raise exception 'check: resgate com categoria aceito';
  exception when check_violation then null;
  end;

  -- Q46: cor de 1 a 8
  begin
    update public.categories set color = 9 where id = a_salario;
    raise exception 'check: cor 9 aceita';
  exception when check_violation then null;
  end;

  -- Apagar a meta apaga o que foi guardado nela
  delete from public.goals where id = a_goal;
  select count(*) into n from public.transactions where kind in ('saving', 'withdrawal');
  if n <> 0 then raise exception 'meta: guardados ficaram sem meta (%)', n; end if;

  -- Q18: apagar categoria deixa a transação como "Sem categoria"
  delete from public.categories where id = a_mercado;
  select count(*) into n from public.transactions where id = a_tx and category_id is null;
  if n <> 1 then raise exception 'q18: transação não ficou sem categoria'; end if;

  -- anon não lê nada
  perform set_config('role', 'anon', true);
  begin
    perform 1 from public.transactions;
    raise exception 'anon: conseguiu ler transactions';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.account_balances;
    raise exception 'anon: conseguiu ler account_balances';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select 'ok' as resultado;

rollback;
