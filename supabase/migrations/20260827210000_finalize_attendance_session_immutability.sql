-- GO-02E.11 — clôture de l'immutabilité des séances d'appel.

begin;

-- Les métadonnées sont en lecture seule dans l'application. La création et la
-- validation passent par des RPC SECURITY DEFINER ; aucun DML direct sur une
-- séance existante n'est nécessaire au rôle authenticated.
revoke update, delete on public.attendance_sessions from authenticated;

commit;
