-- Assistente de IA: limite de mensagens por dia e tokens gastos (spec Q71)

-- Um registro por pessoa por dia (no fuso de São Paulo). Só as funções abaixo escrevem aqui.
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  messages integer not null default 0 check (messages >= 0),
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  cache_read_tokens bigint not null default 0,
  cache_write_tokens bigint not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

create policy "ai_usage: ver o próprio uso" on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);

create function private.today_sp() returns date
language sql stable set search_path = ''
as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

-- Gasta uma mensagem do dia. Devolve quantas já foram usadas, ou null se o limite (30) acabou.
create function public.consume_ai_message() returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  used integer;
begin
  if (select auth.uid()) is null then
    raise exception 'sem login' using errcode = '42501';
  end if;
  insert into public.ai_usage as u (user_id, day, messages)
  values ((select auth.uid()), private.today_sp(), 1)
  on conflict (user_id, day) do update set messages = u.messages + 1
    where u.messages < 30
  returning u.messages into used;
  return used;
end;
$$;

-- Soma os tokens de uma resposta ao dia de hoje (para medir o custo real).
create function public.record_ai_tokens(
  p_input bigint, p_output bigint, p_cache_read bigint, p_cache_write bigint
) returns void
language sql security definer set search_path = ''
as $$
  update public.ai_usage
  set input_tokens = input_tokens + greatest(p_input, 0),
      output_tokens = output_tokens + greatest(p_output, 0),
      cache_read_tokens = cache_read_tokens + greatest(p_cache_read, 0),
      cache_write_tokens = cache_write_tokens + greatest(p_cache_write, 0)
  where user_id = (select auth.uid()) and day = private.today_sp()
$$;

revoke execute on function public.consume_ai_message() from public, anon;
revoke execute on function public.record_ai_tokens(bigint, bigint, bigint, bigint) from public, anon;
grant execute on function public.consume_ai_message() to authenticated;
grant execute on function public.record_ai_tokens(bigint, bigint, bigint, bigint) to authenticated;
