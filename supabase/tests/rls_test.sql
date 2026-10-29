-- Testes de RLS e integridade (spec Q8, Q15, Q17, Q18, Q35, Q36, Q37, Q45, Q46).
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
  a_tx bigint;
  a_rec bigint;
  a_goal bigint;
  n int;
begin
  select id into a_mercado from public.categories where user_id = a and name = 'Mercado';
  select id into a_salario from public.categories where user_id = a and name = 'Salário';
  select id into b_mercado from public.categories where user_id = b and name = 'Mercado';

  -- Q17: categorias iniciais criadas pelo trigger
  select count(*) into n from public.categories where user_id = a;
  if n <> 8 then raise exception 'seed: esperava 8 categorias, veio %', n; end if;

  -- A partir daqui, age como o usuário A
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  select count(*) into n from public.categories;
  if n <> 8 then raise exception 'rls: A deveria ver só as próprias 8 categorias, viu %', n; end if;

  insert into public.transactions (category_id, kind, amount, description)
  values (a_mercado, 'expense', 12.50, 'pão') returning id into a_tx;

  -- A não usa categoria de B
  begin
    insert into public.transactions (category_id, kind, amount) values (b_mercado, 'expense', 1);
    raise exception 'fk: A conseguiu usar categoria de B';
  exception when foreign_key_violation then null;
  end;

  -- A não grava linha em nome de B
  begin
    insert into public.transactions (user_id, kind, amount) values (b, 'expense', 1);
    raise exception 'rls: A conseguiu inserir como B';
  exception when insufficient_privilege then null;
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
    insert into public.transactions (category_id, kind, amount) values (a_salario, 'expense', 1);
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
    insert into public.transactions (kind, amount) values ('expense', 0);
    raise exception 'check: valor zero aceito';
  exception when check_violation then null;
  end;

  -- Q35/Q36: recorrentes
  insert into public.recurrences (category_id, kind, amount, description, day_of_month)
  values (a_mercado, 'expense', 50, 'feira', 10) returning id into a_rec;

  -- Uma confirmação por mês
  insert into public.transactions (kind, amount, occurred_on, recurrence_id) values ('expense', 50, '2026-10-10', a_rec);
  begin
    insert into public.transactions (kind, amount, occurred_on, recurrence_id) values ('expense', 50, '2026-10-20', a_rec);
    raise exception 'unique: duas confirmações no mesmo mês';
  exception when unique_violation then null;
  end;
  insert into public.transactions (kind, amount, occurred_on, recurrence_id) values ('expense', 50, '2026-11-10', a_rec);

  begin
    insert into public.recurrences (kind, amount, description, day_of_month) values ('expense', 1, 'x', 32);
    raise exception 'check: dia 32 aceito';
  exception when check_violation then null;
  end;

  -- Age como B: não vê a recorrente de A nem confirma em nome dela
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.recurrences;
  if n <> 0 then raise exception 'rls: B viu recorrente de A'; end if;
  begin
    insert into public.transactions (kind, amount, recurrence_id) values ('expense', 1, a_rec);
    raise exception 'fk: B confirmou recorrente de A';
  exception when foreign_key_violation then null;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  -- Apagar a recorrente mantém as confirmações, só desfaz a ligação
  delete from public.recurrences where id = a_rec;
  select count(*) into n from public.transactions where amount = 50 and recurrence_id is null;
  if n <> 2 then raise exception 'recorrente: confirmações não ficaram no histórico (%)', n; end if;

  -- Q37: metas e guardado
  insert into public.goals (name, target_amount) values ('viagem', 1000) returning id into a_goal;
  insert into public.transactions (kind, amount, goal_id) values ('saving', 100, a_goal);

  begin
    insert into public.transactions (kind, amount) values ('saving', 1);
    raise exception 'check: guardado sem meta aceito';
  exception when check_violation then null;
  end;
  begin
    insert into public.transactions (kind, amount, goal_id) values ('expense', 1, a_goal);
    raise exception 'check: despesa com meta aceita';
  exception when check_violation then null;
  end;
  begin
    insert into public.transactions (kind, amount, goal_id, category_id) values ('saving', 1, a_goal, a_salario);
    raise exception 'check: guardado com categoria aceito';
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
end;
$$;

select 'ok' as resultado;

rollback;
