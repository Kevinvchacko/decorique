-- Decorique Order Log: usernames. Run once in Supabase > SQL Editor, after team.sql.
-- The Order Log signs people in with a username; Supabase stores each one as <username>@decorique.team
-- (no mail is ever sent there). This puts the five usernames on the team list. Change a name here
-- before running if someone wants a different username. Safe to run again.
insert into public.team_members (email, added_by) values ('kevin@decorique.team', 'setup') on conflict do nothing;
insert into public.team_members (email, added_by) values ('sahana@decorique.team', 'setup') on conflict do nothing;
insert into public.team_members (email, added_by) values ('moulika@decorique.team', 'setup') on conflict do nothing;
insert into public.team_members (email, added_by) values ('shreedharan@decorique.team', 'setup') on conflict do nothing;
insert into public.team_members (email, added_by) values ('swasthikka@decorique.team', 'setup') on conflict do nothing;
select email from public.team_members order by added_at;
