# Storage P0 — exécution HTTP isolée, 27 octobre 2026

Projet exclusif : `ahqrrqgebtfzssmeizfu` (BCVB-Storage-P0-Test). Branche exclusive : `security/staged-production-rls-20261014`. Aucune intervention production, aucun merge de PR #110. Exécution vers 15:27–15:30 UTC (16:27–16:30 Paris).

## Résultat

**Confinement SQL final appliqué, mais confidentialité immédiate HTTP : ÉCHEC.** Les téléchargements authentifiés sur les URL déjà utilisées restent à 200 après suppression des trois politiques SELECT. Les mêmes chemins avec une query unique renvoient 400. Ce contraste indique un effet de cache ; aucune purge ni durée maximale de ce cache n'a été vérifiée.

| Test | Avant | Confiné | Restauré | Final confiné |
|---|---|---|---|---|
| Téléchargement, chacun des 7 comptes, URL réutilisée | 200 | **200 : échec du refus** | 200 | **200 : échec du refus** |
| Création de signature, chacun des 7 comptes | 200 | 400 | 200 | 400 |
| Listing, chacun des 7 comptes | 200, témoin présent | 200, vide | 200, témoin présent | 200, vide |
| Anonyme : téléchargement / listing / signature | 400 | 400 | 400 | 400 |
| URL publique du bucket privé | 400 | 400 | 400 | 400 |
| service_role : téléchargement / listing / signature | 200 | 200 | 200 | 200 |
| URL signée avant confinement (TTL 120 s) | 200 | 200 | 200 | 200 avant expiration |

Après expiration : **400**, `InvalidJWT`, message `"exp" claim timestamp check failed`, y compris avec query unique : PASS. Sous confinement final, téléchargement avec query unique : **400 pour les 7 comptes**, PASS. Les URL nouvellement signées lorsque permis ont toutes été téléchargées en 200 et contrôlées par SHA-256.

## Fixtures et intégrité

7 comptes créés via Auth Admin API, connexion par mot de passe réussie et vérification des claims `sub`, `role=authenticated`, `app_metadata.p0_persona`. Personae : authenticated, player_a, player_b, parent, coach, admin, inactive. Adresses aléatoires `example.invalid`, aucune donnée personnelle. Les labels admin/inactive ne confèrent ni privilège métier ni désactivation réelle : ce sont des comptes Auth distincts, tous de rôle PostgreSQL authenticated.

Un seul fichier texte synthétique de 65 octets, téléversé par Storage API (HTTP 200), dans le bucket privé `Bcvb-library`. Tous les corps de téléchargement réussis, avant/après confinement et restauration, correspondent à :

`8c4741b12e587ef0ee37648d2da5f518b1000daf0b49483a528b1b4f0e37edf7`

État final SQL : 0 politique sur storage.objects, RLS=true, bucket public=false, 1 objet, 7 comptes. Fixtures conservées pour investigation. Identifiants secrets et URL signée non inclus dans les preuves ; état temporaire local supprimé après les mesures.

## Preuves et reproductibilité

Dossier [preuves JSON](evidence/storage-p0-http-2026-10-27/) : baseline, confined, restored, final, expired, uncached, expired-uncached, final-sql. Horodatages UTC et empreintes inclus dans les mesures. Les fichiers stdout conservent les premières exécutions. Les SQL manuels existants ont été utilisés : restauration initiale, confinement, restauration, confinement final. Pas de migration ajoutée.

Scripts : `tests/security/storage_p0_live_cycle.py`, `tests/security/storage_p0_cache_diagnostic.py`. Destination et branche verrouillées. Ils nécessitent un fichier de clés privé local, ne récupèrent pas automatiquement des secrets et ne changent pas les politiques SQL. Le cycle SQL doit être orchestré explicitement et finir confiné.

Deux assertions du banc ont été corrigées : listing anonyme 400 (initialement seule une liste vide 200 était acceptée), et message d'expiration `exp` (initialement recherche du mot « expired » seulement). Ce sont des erreurs d'assertion, pas des vulnérabilités supplémentaires. Les 200 authentifiés sous confinement restent des échecs explicites, sans assouplissement du critère.

## Limites

- Validation d'un fichier témoin, pas de matrice de documents actifs/supprimés/orphelins ni de modèle métier parent/joueur/coach réel.
- Pas de test des exports applicatifs, contenu inline, file_url externe, proxy serveur ou architecture de remplacement ; aucune garantie globale de confidentialité.
- service_role contourne RLS comme attendu ; une URL déjà signée reste un accès porteur valide jusqu'à expiration. Pas de test d'invalidation des JWT Auth ou sessions.
- Effet de cache observé sans identification certaine de la couche ni mesure de sa durée. Cache-Control no-cache côté requête n'a pas empêché les 200. Pas de purge.
- CLI 2.120.0 ; service Storage hébergé, version d'image non épinglée.
- Advisor sécurité : protection des mots de passe compromis désactivée sur le projet isolé ; aucun réglage Auth modifié. Voir https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.
- Documentation consultée : https://supabase.com/docs/guides/storage/serving/downloads ; changelog téléchargé. Ne pas extrapoler cette expérience à la production.

**Production : NO-GO. PR #110 non fusionnée.**
