-- AUTH-PROD-001: на hosted-базе владелец уже включил RLS в SQL Editor («Run and enable RLS»);
-- миграция фиксирует это, чтобы новая база из миграций совпадала с продом.
-- Политик нет намеренно: пишет только security definer триггер private.handle_new_user,
-- читает только service role (обходит RLS); anon/authenticated доступа не имеют (000300).
alter table private.signup_consents enable row level security;
