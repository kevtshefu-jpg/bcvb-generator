# GO05 — Matrice de validation sur clone isolé (NON EXÉCUTÉE)

Date : 26 octobre 2026. Cette matrice est un **plan de test**, pas un procès-verbal d'exécution. Aucun accès de production, JWT réel, document de mineur ou chemin privé ne doit être consigné.

## Préconditions bloquantes
1. Clone PostgreSQL isolé et sauvegarde vérifiée ; service PostgREST/Storage de test réellement opérationnel et sans connexion à la production.
2. Fixtures entièrement fictives : profils anon, joueur actif, joueur inactif, parent actif, coach actif, dirigeant actif, administrateur actif ; propriétaire de document actif et inactif.
3. Fixtures de documents avec combinaisons `deleted_at` (NULL/non-NULL), `is_active` (true/false), `status` (uploaded/published), `audience` (public/member/parent/Coachs/Interne club) et `uploaded_by` (propriétaire/autre).
4. Fichiers Storage de test, sans réutiliser les huit objets de production ; bucket privé configuré avec la **casse exacte**.
5. Exécution transactionnelle du SQL manuel actuel sur clone avec retour arrière, puis contrôle des grants, policies, erreurs et effets sur l'application.

## Matrice PostgREST — attendu pour les lectures ordinaires
| Identité | Document fictif | Résultat attendu |
| --- | --- | --- |
| anon | publié, public, actif, non supprimé | Autorisé |
| anon | publié, public, actif, supprimé | Refus |
| anon | brouillon, public, actif, non supprimé | Refus |
| joueur actif | publié, member, actif, non supprimé | Autorisé |
| joueur actif | publié, member, actif, supprimé | Refus |
| parent actif | publié, parent, actif, non supprimé | Autorisé, sous réserve de rattachement métier si exigé |
| joueur actif | publié, parent, actif, non supprimé | Refus |
| coach actif | brouillon, actif, non supprimé | Selon règle staff validée (la policy préparée l'autorise) |
| coach actif | brouillon, actif, supprimé | Refus |
| propriétaire actif | son brouillon, actif, non supprimé | Autorisé |
| propriétaire actif | son brouillon, actif, supprimé | Refus |
| admin actif | fiche supprimée | Refus via lecture ordinaire ; corbeille séparée non implémentée |
| tout profil inactif | fiche interne, non supprimée | Refus |
| tout profil | fiche inactive, non supprimée | Refus |

**Attention :** les résultats ci-dessus doivent être mesurés avec les vrais JWT/claims et le schéma du clone. Les assertions statiques ne démontrent pas ces autorisations. Tester également l'absence de fuite par compteurs, RPC, exports, endpoints serveur et jointures.

## Matrice Storage — fail closed
| Scénario | Attendu |
| --- | --- |
| anon → objet privé | Refus |
| joueur actif → objet sans fiche | Refus |
| parent → objet rattaché à une fiche supprimée | Refus |
| coach → objet rattaché à une fiche supprimée | Refus |
| admin → objet supprimé via parcours normal | Refus, hors mécanisme administratif dédié |
| utilisateur inactif → objet privé | Refus |
| URL signée émise avant changement de droits | Risque résiduel à caractériser : tester durée de validité et révocation |
| fiche inline avec chemin fictif | Lecture du contenu autorisé selon RLS ; **aucune hypothèse d'objet téléchargeable** |
| objet réellement stocké | Télécharger uniquement après contrôle effectif du statut, de l'audience, du bucket et du droit |

Le SQL de la PR #110 **ne corrige pas** les policies `storage.objects` ; tant que l'accès direct Storage reste large, ce volet est **NO-GO**.

## Contrôles et preuves acceptables
- Journal de tests avec date, version du commit, environnement isolé, rôle fictif, cas, résultat observé, attendu et statut PASS/FAIL ; sans identifiants réels ni contenu privé.
- Résultats de test SQL, PostgREST et Storage séparés ; une réussite SQL seule ne vaut pas validation HTTP.
- Vérification du rollback transactionnel et de l'état du clone après essai.
- Régression des parcours joueur, parent, coach, bibliothèque, documents inline et exports ; contrôle mobile/ordinateur.
- Toute différence entre attendu et observé entraîne **NO-GO**, avec issue dédiée et correctif testé avant nouvelle revue.

## Décision de livraison
**NO-GO** tant que la matrice n'a pas été exécutée et que les accès directs Storage, les fonctions `SECURITY DEFINER`, la sauvegarde/restauration fonctionnelle et la corbeille administrative éventuelle ne sont pas traités. Ne jamais fusionner ou exécuter le SQL en production sur la seule base de ce document.
