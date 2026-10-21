# BCVB — Sauvegarde complète et exercice de restauration avant RLS

**État : procédure de préparation, non exécutée.** Aucun export de production n'est lancé par ce document.

## Objectif et limites

Pouvoir revenir à un état cohérent en cas d'incident après une modification des règles RLS ou Storage. Le test SQL en `ROLLBACK` sur la copie PostgreSQL existante **ne prouve pas** qu'une sauvegarde de production complète peut être restaurée.

Un `pg_dump` PostgreSQL peut contenir schémas, données et métadonnées de `auth` et `storage` **si** le rôle de connexion est autorisé à les lire. Il ne contient **pas les octets des objets** hébergés dans le stockage de fichiers Supabase. Les objets Storage doivent être sauvegardés séparément avec leurs métadonnées, permissions et correspondances, en conservant l'intégrité et la confidentialité des données.

## Périmètre minimal à vérifier

- Schémas et données PostgreSQL utiles : `public`, `auth`, `storage`, fonctions, triggers, policies, grants, migrations et extensions nécessaires.
- Données des profils, équipes, présences, exercices, programmes et documents ; aucun contenu privé ne doit être copié dans GitHub ou un chat.
- Contenu binaire des objets Storage, en plus des lignes `storage.objects`, avec contrôle d'intégrité.
- Paramètres et configurations qui ne sont pas dans la base : Auth providers, URL de redirection, Edge Functions, secrets et paramètres des buckets ; secrets à conserver dans un coffre adapté, jamais dans un dump en clair partagé.
- Versions PostgreSQL, extensions, outils, date/heure et procédure de restauration compatibles.
- Accès et droits du rôle qui effectuera la restauration, y compris les différences entre base Supabase managée et PostgreSQL isolé.

## Procédure sous contrôle d'un opérateur habilité

1. Préparer un stockage local chiffré avec espace suffisant et accès restreint. Ne pas utiliser le dépôt GitHub, une URL publique ou un espace de synchronisation non approuvé.
2. Obtenir les paramètres de connexion par un gestionnaire de secrets ; ne jamais les afficher dans les commandes copiées dans le chat, les journaux CI ou l'historique shell.
3. Exporter les schémas et données nécessaires avec un client compatible, puis sauvegarder **séparément** les octets Storage. Vérifier les exclusions et les éventuelles erreurs de permission : un export partiel doit être étiqueté comme tel.
4. Calculer des empreintes locales, noter la taille, la date, le nombre de fichiers et les codes de sortie, sans divulguer le contenu ni les chemins privés.
5. Restaurer dans un environnement **neuf, isolé et sans exposition réseau**, distinct de la production, de la préproduction et du conteneur de développement.
6. Vérifier les objets PostgreSQL, les fonctions et policies, les relations, les lignes de référence, les utilisateurs Auth factices ou restaurés selon la procédure autorisée, et les octets Storage restaurés.
7. Réaliser des scénarios de lecture/écriture sur **fixtures dédiées** (anonyme, joueur actif/inactif, parent, coach, admin), et un exercice documenté de retour arrière.
8. Faire valider la couverture du périmètre et la fenêtre d'intervention par le responsable technique avant toute migration de production.

## Contrôle préalable du Mac et du conteneur isolé

Le fichier `ops/manual/local-restore-readiness-2026-10-21.sh` effectue **uniquement** les contrôles suivants sur le Mac de l'opérateur : présence de Docker, existence et fonctionnement du conteneur `bcvb-restore-test`, réseau `none`, absence de ports publiés, disponibilité des clients PostgreSQL et requête SQL de comptage/version sans données personnelles. Il ne contacte pas Supabase, ne demande aucun mot de passe et ne restaure aucune sauvegarde.

L'exécuter localement après lecture du fichier, depuis le dépôt synchronisé :

```sh
sh ops/manual/local-restore-readiness-2026-10-21.sh
```

Si le dépôt local n'est pas synchronisé, récupérer le fichier depuis un **commit GitHub épinglé** et vérifier son contenu avant de l'exécuter. Ne jamais remplacer ce contrôle par une commande `curl | sh` non vérifiée. La réussite de ce contrôle **ne vaut pas** sauvegarde complète restaurable.

## Résultat opérateur — contrôle local du 21 octobre 2026

**PASS, limité à la préparation technique** : exécution sur Mac du script épinglé au commit `df21d22f`, avec contrôle de son empreinte Git `5f5391c635b757116f54ce2d4b22d6b327091ece` avant lancement. Sortie fournie : conteneur `bcvb-restore-test` en fonctionnement, réseau `none`, aucun port publié, clients `pg_dump`/`pg_restore`/`psql` présents, PostgreSQL 17.11 et 39 tables `public`. Le script a indiqué `OK : environnement isole accessible en lecture seule`.

**Limite** : aucun test de restauration de sauvegarde complète n'a été réalisé, et aucune preuve de couverture Auth/Storage ou de restauration des octets des objets n'a été produite. Ne pas qualifier ce contrôle de « sauvegarde validée ».

## Source officielle et vérification de couverture

La [documentation Supabase des sauvegardes](https://supabase.com/docs/guides/platform/backups) indique que les sauvegardes de base **ne contiennent pas les octets des objets Storage**, seulement leurs métadonnées. Les sauvegardes automatiques quotidiennes dépendent de l'offre et de la configuration du projet. Avant toute exportation manuelle, l'opérateur doit vérifier dans **Dashboard → Database → Backups** l'existence d'une sauvegarde récente et la méthode de restauration disponible, **sans cliquer sur Restore**. Une sauvegarde automatique de base, même disponible, ne satisfait pas seule le périmètre Storage.

Le [guide officiel de migration et restauration](https://supabase.com/docs/guides/self-hosting/restore-from-platform) précise également que les dumps CLI peuvent appliquer des exclusions internes : vérifier **effectivement** la présence des données Auth nécessaires dans les fichiers produits et après restauration. Ne pas inférer leur couverture du seul succès d'une commande de dump.

## Contrôle du Dashboard de production — forfait gratuit

Le responsable technique a consulté **Database → Backups → Sauvegardes planifiées** du projet `leziahqmqyuewpzjmzxf` le **21 octobre 2026**. Le tableau de bord indique **GRATUIT** et le message « Le forfait gratuit n'inclut pas les sauvegardes de projet ». **Aucune sauvegarde automatique planifiée n'est disponible via cette fonctionnalité.**

**Décision de sécurité : NO-GO production** tant qu'une sauvegarde manuelle privée, complète, contrôlée et effectivement restaurée n'a pas été démontrée. Ne pas activer une offre payante ni déclencher de restauration sur production sans approbation explicite. Le stockage d'objets doit être sauvegardé séparément ; les métadonnées SQL ne sont pas les octets des fichiers.

### Préflight Mac suivant (inspection uniquement)

Le script `ops/manual/local-backup-preflight-2026-10-21.sh` vérifie localement, **sans réseau ni accès à la production**, les versions de Supabase CLI et des clients PostgreSQL, l'espace disque disponible, l'état FileVault et l'existence/taille globale du dossier de sauvegarde. Aucun chemin de fichier individuel, mot de passe, jeton ou contenu de base n'est affiché. Le test `tests/security/local-backup-preflight-contract.test.ts` est exécuté en CI.

Ce préflight **n'effectue aucun export**. Après résultat, établir la procédure de sauvegarde compatible avec la version CLI, le chiffrement du disque et les capacités réelles de l'environnement. En cas de FileVault désactivé ou d'espace insuffisant, arrêter avant toute exportation de données personnelles.

## Résultat opérateur — préflight Mac complet (21 octobre 2026)

Exécution locale du script épinglé au commit `4cc8b29e` et vérifié par son empreinte Git `6c45a52f1440f8a1d9162db67c171df7763235ba` :

| Indicateur | Observation |
| --- | --- |
| Supabase CLI | 2.120.0 (2.121.0 proposée, mise à jour non obligatoire avant ce diagnostic) |
| Clients `pg_dump`, `pg_restore`, `psql` | PostgreSQL 17.11 Homebrew |
| Espace libre sur le volume utilisateur | 18,7 Gio |
| FileVault | Activé |
| Dossier privé | Présent |
| Exports existants | 2,4 Mio au total |

**PASS pour la préparation du poste**. Les 2,4 Mio existants ne prouvent pas la présence des schémas Auth/Storage, des octets Storage ni la restauration effective. Les versions des clients et du serveur sont compatibles au niveau majeur PostgreSQL 17.

### Taille et couverture de la source de production — agrégats en lecture seule

Au 21/10/2026, la base de production indique : **PostgreSQL 17.6, taille totale 16 MB, 27 tables `auth`, 8 tables `storage`, 6 utilisateurs Auth, 8 objets Storage et 1 bucket**. La taille de 16 MB est une taille PostgreSQL, **pas la taille des octets des 8 objets**. Aucun contenu, identifiant d'utilisateur ou chemin de fichier n'a été interrogé.

### Attention — les exports Supabase CLI ne sont pas une sauvegarde Auth/Storage exhaustive

La [référence officielle `supabase db dump`](https://supabase.com/docs/reference/cli/supabase-db-dump) précise que l'outil **exclut les schémas gérés `auth` et `storage`** par défaut. Le trio standard `--role-only`, schéma et `--data-only` ne prouve donc **pas** la couverture de ces données. Une extraction séparée et vérifiée de ces schémas avec `pg_dump` brut peut être nécessaire, en fonction des privilèges de connexion ; sa restauration doit être testée sur une installation compatible, et non présumée à partir d'un conteneur PostgreSQL vide.

La [documentation Storage](https://supabase.com/docs/guides/storage/management/download-objects) confirme qu'il faut récupérer séparément les octets des fichiers (Dashboard, CLI Storage ou client S3 compatible). Le bucket réel est `Bcvb-library` ; respecter sa casse exacte. **Aucune copie des objets ne doit être rendue publique ni versée dans GitHub.**

### Prochaine étape opérateur — sans transmettre de secret

1. Dans le projet de production, ouvrir **Connect** et relever le mode de connexion proposé (**Session pooler**, idéalement port 5432 ; ou connexion directe si IPv6 disponible). Ne pas copier l'URL complète dans une conversation.
2. Confirmer uniquement que le **mot de passe de base de données est disponible** dans le coffre de mots de passe ; **ne pas le transmettre**, ne pas le réinitialiser sans raison et ne pas saisir une URL contenant ce mot de passe dans une commande conservée par l'historique du terminal.
3. Préparer une extraction PostgreSQL en lecture seule vers un dossier chiffré et restreint, puis un export séparé des huit objets Storage ; valider les codes de sortie et les manifestes **sans divulguer les fichiers**.
4. Préparer un **nouvel environnement de restauration isolé**, distinct de `bcvb-restore-test`, et une méthode de restauration adaptée aux schémas Supabase gérés.

**NO-GO** tant que la connexion de sauvegarde et la restauration complète n'ont pas été validées.

## Connexion source : retour opérateur du 21 octobre 2026

L'opérateur confirme que l'interface Supabase lui propose **uniquement une connexion directe** et que le **mot de passe PostgreSQL est disponible localement**, non communiqué. Il n'a pas fourni de chaîne de connexion ni de secret.

D'après la [documentation officielle Supabase sur les connexions](https://supabase.com/docs/guides/database/connecting-to-postgres), la connexion directe des projets gratuits utilise **IPv6**, port **5432**. Les modes de pooler en session peuvent fournir une alternative IPv4, mais leur disponibilité doit être vérifiée dans le projet ; **ne pas acheter d'add-on IPv4 ni modifier la configuration** pour cette étape.

### Diagnostic suivant : résolution DNS AAAA et accès TCP IPv6 sans mot de passe

- Script `ops/manual/local-direct-ipv6-preflight-2026-10-21.sh` : vérifie seulement la résolution DNS IPv6 et la possibilité d'ouvrir une connexion **TCP** sur le port 5432 depuis le Mac, sans authentification, sans commande SQL et sans divulguer l'adresse IP.
- Test `tests/security/local-direct-ipv6-preflight-contract.test.ts` exécuté en CI : interdit l'envoi de données ou l'utilisation de secrets dans le diagnostic.
- Si **accessible**, préparer ensuite une authentification PostgreSQL **interactive** (mot de passe saisi uniquement dans le terminal, jamais dans un argument de commande, dans GitHub ou dans une conversation) et une requête de validation strictement en lecture seule.
- Si **inaccessible**, interrompre la préparation d'export direct et rechercher un accès pooler en session IPv4 ou un réseau IPv6 compatible. Ne pas tester de mode transaction pour une sauvegarde `pg_dump` sans validation spécifique.
- **Limite** : la réussite du TCP ne prouve pas que les identifiants, les droits d'export Auth/Storage ou la restauration fonctionnent.

## Résultat réseau IPv6 — 21 octobre 2026

L'opérateur a exécuté `ops/manual/local-direct-ipv6-preflight-2026-10-21.sh` après vérification de son empreinte Git. Résultat : **DNS IPv6 disponible, TCP IPv6 port 5432 accessible** pour `db.leziahqmqyuewpzjmzxf.supabase.co`. Aucun mot de passe ni SQL n'a été utilisé.

### Étape suivante : authentification interactive chiffrée et contrôlée

Le script `ops/manual/local-direct-auth-readonly-2026-10-21.sh` :

- exige un **certificat racine CA Supabase** téléchargé depuis les paramètres SSL du projet de production et enregistré dans `$HOME/BCVB_SAUVEGARDES_PRIVEES/supabase-production-ca.crt` (ou indiqué par `BCVB_SSL_ROOT_CERT`) ;
- impose `PGSSLMODE=verify-full` et `PGSSLROOTCERT` pour vérifier le certificat du serveur, pas seulement chiffrer le transport ;
- demande le mot de passe **interactivement dans psql**, sans l'inscrire dans les arguments ni dans l'historique shell, avec `PGPASSFILE=/dev/null` ;
- force `default_transaction_read_only=on` et exécute une transaction `BEGIN READ ONLY` contenant **uniquement trois requêtes SELECT** de version, de droits de lecture par schéma et de privilèges ciblés `auth.users`, `storage.objects` et `storage.buckets` ;
- ne réalise ni export ni mutation de données ; un test Vitest `tests/security/local-direct-auth-readonly-contract.test.ts` est ajouté à la CI.

Le certificat racine n'est pas une clé secrète, mais le conserver hors dépôt évite de le confondre avec d'autres environnements. **Ne jamais transmettre le mot de passe ni la chaîne de connexion.** Si `verify-full` échoue, **ne pas rétrograder en `sslmode=require`** sans investigation du certificat. Voir [documentation officielle Supabase — Connecting with PSQL](https://supabase.com/docs/guides/database/psql).

Une authentification réussie **ne prouve pas** encore la couverture de `pg_dump` ni la restauration des données Auth et des octets Storage.

## Vérifications non destructives possibles sur un export local

Exemples à adapter **sur le fichier déjà créé**, sans connexion à la production :

```sh
# Le fichier doit être déjà présent dans un emplacement privé chiffré.
pg_restore --list /chemin/prive/backup.dump > /chemin/prive/backup-manifest.txt
shasum -a 256 /chemin/prive/backup.dump
```

Le succès de `pg_restore --list` ne démontre que la lisibilité de l'archive, **pas** la réussite d'une restauration complète. Le test de restauration reste obligatoire.

## Critères de décision

- **GO sauvegarde** : périmètre exhaustif démontré, stockage binaire couvert, empreintes cohérentes, restauration et scénarios validés, plan de retour arrière approuvé.
- **NO-GO** : Auth ou Storage absents, export incomplet, permissions de restauration manquantes, erreur d'intégrité, données sensibles exposées, environnement de test non isolé, ou absence de validation métier.

Liens : [PR #110](https://github.com/kevtshefu-jpg/bcvb-generator/pull/110) et [matrice d'accès bibliothèque](./library-storage-access-decision-2026-10-21.md).
