begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(6);

select has_function('public', 'check_rate_limit', ARRAY['text', 'integer', 'integer'], 'check_rate_limit exists');

-- Лимит 3 в окне: три проходят, четвёртый блокируется
select ok(check_rate_limit('t:a', 60, 3), 'hit 1 allowed');
select ok(check_rate_limit('t:a', 60, 3), 'hit 2 allowed');
select ok(check_rate_limit('t:a', 60, 3), 'hit 3 allowed');
select ok(not check_rate_limit('t:a', 60, 3), 'hit 4 blocked');
-- другой ключ считается независимо
select ok(check_rate_limit('t:b', 60, 3), 'other key allowed');

select * from finish();
rollback;
