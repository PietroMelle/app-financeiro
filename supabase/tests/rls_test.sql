-- Testes de RLS e integridade (spec Q8, Q15, Q17, Q18).
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
