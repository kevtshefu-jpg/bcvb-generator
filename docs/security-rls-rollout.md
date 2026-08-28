# Déploiement du durcissement RLS BCVB

## Périmètre

La migration `20260719090000_harden_role_and_team_rls.sql` sécurise les profils,
les demandes, les notifications, les équipes, les effectifs, les contacts,
les imports, les séances et les situations.

Les présences sont encore stockées côté client : aucune table de présence n'est
actuellement disponible dans les migrations locales. Lors de leur persistance,
chaque ligne devra porter un `team_id` et réutiliser `can_access_team(team_id)`.

## Avant application distante

1. Faire une sauvegarde Supabase et relever les policies présentes en production.
2. Créer un environnement Supabase de préproduction depuis une copie anonymisée.
3. Vérifier que chaque coach existant est relié à une équipe par `head_coach_id`,
   `assistant_coach_ids` ou `team_staff_assignments`.
4. Vérifier que les profils actifs ont bien `profile_status = active`.
5. Appliquer les migrations en préproduction, jamais directement en production.
6. Exécuter la requête de détection des policies permissives. La migration échoue
   volontairement si une table historique conserve `USING (true)` ou
   `WITH CHECK (true)` : examiner la policy au lieu de la supprimer aveuglément.

Les scripts présents dans ce dépôt ne lancent aucune migration et ne déploient
aucune fonction. L'application de la migration et le déploiement des Edge
Functions restent deux actions manuelles séparées, précédées d'une sauvegarde.

## Verrou obligatoire de ciblage

Avant toute fixture, définir et vérifier la cible :

```bash
export SUPABASE_URL="https://<PREPROD_PROJECT_REF>.supabase.co"
export SUPABASE_ANON_KEY="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
export RLS_TEST_ENVIRONMENT="preproduction"
export RLS_TEST_PROJECT_NAME="bcvb-preproduction"
export RLS_TEST_PROJECT_REF="<PREPROD_PROJECT_REF>"
export RLS_TEST_CONFIRM_PROJECT_REF="<PREPROD_PROJECT_REF>"
export RLS_TEST_PRODUCTION_PROJECT_REF="<PRODUCTION_PROJECT_REF>"
npm run test:preprod:check
```

Le contrôle affiche le nom, l'URL et le project ref sans lire ni modifier la
base. Toute incohérence interrompt les scripts. Ne jamais placer la Service Role
Key dans une variable `VITE_*`, un fichier commité ou le navigateur.

Avant l'application, identifier aussi les données sportives orphelines. Elles
seront volontairement invisibles aux coachs tant qu'elles n'ont pas de `team_id` :

```sql
select id, title from public.sessions where team_id is null;
select id, title from public.situations where team_id is null;

select t.id, t.name, t.head_coach_id
from public.teams t
left join public.profiles p on p.id = t.head_coach_id
where t.head_coach_id is not null and p.id is null;
```

La dernière requête détecte les anciens identifiants de coach sans profil. Ils ne
peuvent pas être migrés dans `team_staff_assignments` et doivent être corrigés
avant la recette.

## Fixtures obligatoires de préproduction

Les équipes A et B doivent chacune contenir :

- un coach actif explicitement affecté ;
- un joueur relié par `team_memberships` ;
- un contact pour ce joueur ;
- une séance privée portant le bon `team_id` ;
- une situation privée portant le bon `team_id`.

Les identifiants de ces lignes alimentent le script JWT. Un test d'isolation
manquant provoque désormais un échec : aucun `SKIP` n'est accepté.

Après migration, cette commande réservée aux admins identifie les équipes sans
staff actif :

```sql
select * from public.list_teams_without_active_staff();
```

## Comptes de recette nécessaires

- administrateur ;
- coach A affecté à l'équipe A ;
- coach B affecté à l'équipe B ;
- dirigeant ;
- membre simple ;
- compte inactif pour une recette manuelle complémentaire.
- responsable technique actif, distinct de l'administrateur et du dirigeant.

Ils sont créés automatiquement avec les équipes et données de test :

```bash
npm run test:preprod:check
npm run seed:rls
npm run test:rls
npm run test:edge
npm run test:integration
```

Les mots de passe générés sont conservés dans `.rls-test-fixtures.json`, avec
des permissions locales `0600`. Ce fichier est ignoré par Git. Les exécutions
suivantes réutilisent les mêmes comptes et mettent les données à jour.
Le fichier mémorise également la cible. Il est refusé si le project ref courant
diffère de celui du seed.

Le seed affiche les UUID de chaque compte, équipe, joueur, contact, séance,
situation, demande sentinelle et notification sentinelle. Les UUID de données
sont fixes et les écritures utilisent des upserts.

## Test direct avec les JWT Supabase

Le script se connecte réellement avec chaque compte et interroge l'API Supabase.
Il ne doit utiliser que des comptes et données de préproduction.

Le script charge automatiquement l'URL et la clé publique depuis `.env.local`
ou l'environnement, puis récupère comptes et identifiants depuis le fichier de
fixtures créé par `npm run seed:rls`.

Le test vérifie les rôles actifs, l'invisibilité des demandes et notifications,
le refus d'auto-promotion, la protection des RPC `security definer` et
l'isolation entre deux équipes, y compris les insertions inter-équipe refusées.

## Ordre de recette préproduction

1. Créer le projet Supabase isolé et noter son project ref.
2. Restaurer une copie anonymisée ou créer le schéma de préproduction.
3. Sauvegarder cet état initial.
4. Auditer les données orphelines avec les requêtes ci-dessus.
5. Appliquer manuellement la migration RLS sur cette cible uniquement.
6. Déployer manuellement les Edge Functions auditées sur cette cible uniquement.
7. Configurer les variables de ciblage et exécuter `npm run test:preprod:check`.
8. Exécuter `npm run test:integration`.
9. Réaliser la checklist manuelle ci-dessous.
10. Conserver les sorties de commande et le project ref dans le dossier de recette.

Arrêter immédiatement si le project ref affiché n'est pas celui de la
préproduction ou si une policy permissive fait échouer la migration.

## Validation manuelle en préproduction

- [ ] Admin : lit et traite les inscriptions et notifications.
- [ ] Responsable technique : vérifie les droits attendus par le club.
- [ ] Dirigeant : lit les deux équipes sans pouvoir modifier les profils.
- [ ] Coach A : voit uniquement l'équipe A, ses joueurs, contacts et contenus privés.
- [ ] Coach B : voit uniquement l'équipe B, ses joueurs, contacts et contenus privés.
- [ ] Coach A : ne peut modifier aucune ligne de l'équipe B par appel REST direct.
- [ ] Membre : ne voit aucune équipe, joueur, contact ou contenu privé.
- [ ] Profil inactif : `current_user_role()` retourne `inactive` et toutes les données privées sont invisibles.
- [ ] Coach et membre : l'auto-promotion et l'auto-réactivation échouent.
- [ ] Inscription publique : une demande crée une seule notification et un seul envoi email.
- [ ] Deux appels de notification pour la même demande : le second est refusé.
- [ ] `list_teams_without_active_staff()` retourne les équipes réellement orphelines.
- [ ] Les écrans coach et dirigeant affichent un état vide compréhensible si aucune donnée n'est autorisée.

## Passage en production

1. Geler temporairement les créations et affectations d'équipes.
2. Exporter le schéma, les policies et une sauvegarde restaurable datée.
3. Rejouer la migration sur une copie fraîche de production et exécuter `npm run test:rls`.
4. Vérifier les équipes sans staff, puis compléter leurs affectations.
5. Appliquer la migration en production pendant une fenêtre annoncée.
6. Déployer les Edge Functions corrigées dans la même fenêtre.
7. Exécuter immédiatement les tests JWT et la checklist manuelle critique.
8. Surveiller les erreurs `42501`, les connexions et les inscriptions pendant le pilote.

Ne pas poursuivre si la migration signale une policy permissive inconnue, si une
fixture inter-équipe est visible par le mauvais coach ou si une Edge Function
déployée n'est pas la version auditée.

## Rollback

Le rollback de sécurité ne doit pas rétablir les anciennes policies permissives.

1. Fermer l'accès applicatif ou activer une page de maintenance.
2. Conserver les journaux et relever l'erreur exacte.
3. Pour une erreur de code sans corruption de données, redéployer la version
   précédente de l'application et des Edge Functions, mais garder la RLS active.
4. Pour une incompatibilité de policy, appliquer une migration corrective ciblée
   depuis la copie préproduction validée.
5. Pour un échec structurel non corrigible, restaurer la sauvegarde Supabase dans
   un nouveau projet contrôlé, vérifier les accès, puis basculer l'application.
6. Ne restaurer directement la base de production qu'après validation explicite
   de la fenêtre de perte de données et de l'état de la sauvegarde.

Avant déploiement, produire aussi une migration inverse documentée pour les seuls
objets structurels ajoutés (`team_staff_assignments`, `situations.team_id`,
`registration_requests.notification_sent_at`). Cette migration inverse ne doit
jamais recréer de policy `true`.

## Critères de passage en production

- tous les tests du script passent ;
- un coach ne voit aucune ligne de l'équipe voisine ;
- un dirigeant est en lecture globale sans droit d'administration des comptes ;
- un membre ne voit que son profil et les contenus explicitement partagés ;
- l'inscription publique fonctionne encore, même si la notification directe
  côté navigateur est désormais refusée ;
- les Edge Functions de notification utilisent bien la clé de service côté serveur ;
- aucune policy restante n'a une condition globale `true` non justifiée.

## Contrôle après migration

```sql
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
order by relname;
```

Conserver la sauvegarde jusqu'à la fin du pilote et surveiller les refus `42501`
dans les journaux Supabase afin de distinguer une attaque d'une affectation
d'équipe manquante.
