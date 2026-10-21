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
