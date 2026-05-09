create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  is_admin boolean := exists(
    select 1 from admins where user_id = (event->>'user_id')::uuid
  );
begin
  return jsonb_set(event, '{claims,is_admin}', to_jsonb(is_admin));
end;
$$;

revoke all on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
