# GO05 — Procédure de non-diffusion des documents supprimés (PROPOSITION, NON DÉPLOYÉE)

Date : 26 octobre 2026. Décision métier : `deleted_at IS NOT NULL` interdit toute consultation ordinaire, même si `is_active=true` ou `status='published'`. Les 22 fiches historiques restent intactes ; aucune restauration, purge ou modification de données n'est autorisée par ce document.

## Périmètre et invariants
- Tous les rôles ordinaires, y compris propriétaire, coach, dirigeant et responsable technique, sont soumis au filtre `deleted_at IS NULL` sur les lectures normales.
- Un administrateur n'accède aux fiches supprimées que par une **corbeille séparée**, à concevoir et tester ; aucune exception générale dans la policy SELECT de la bibliothèque ordinaire.
- Une fiche visible exige aussi `is_active IS TRUE` ; pour la diffusion aux membres et au public, `status='published'` et une audience explicitement autorisée sont obligatoires.
- `uploaded` n'est pas synonyme de `published`. L'accès staff aux brouillons non supprimés est à confirmer selon le périmètre métier.
- Les objets du bucket privé `Bcvb-library` ne sont jamais rendus publics du seul fait de leur existence. Les sept objets sans fiche restent intacts et en attente de qualification.
- Aucune copie de contenu, chemin Storage, identité de mineur ou jeton dans GitHub, CI ou les rapports.

## Correction SQL préparatoire (branche PR #110)
La policy `bcvb_rls_20261014_library_authenticated_read` a été corrigée dans le SQL manuel : le filtre `is_active IS TRUE AND deleted_at IS NULL` précède toutes les branches de lecture. La garde qui bloquait les 22 fiches historiques a été retirée. **Aucune exécution SQL ni validation fonctionnelle sur clone n'a eu lieu** ; contrôler aussi les accès Storage, RPC et liens signés avant déploiement.

### Patron de politique à adapter et tester sur clone isolé (NE PAS EXÉCUTER EN PRODUCTION)
```sql
-- Fragment de prédicat USING pour la lecture authenticated, pas une migration :
is_active IS TRUE
AND deleted_at IS NULL
AND (
  public.current_user_role() IN ('admin','responsable_technique','dirigeant','coach')
  OR (
    uploaded_by = auth.uid()
    AND public.current_user_role() IS NOT NULL
    AND public.current_user_role() <> 'inactive'
  )
  OR (
    public.current_user_role() IS NOT NULL
    AND public.current_user_role() <> 'inactive'
    AND status = 'published'
    AND (
      audience IN ('public','member')
      OR (audience='parent' AND public.current_user_role() IN ('parent','parent_referent'))
    )
  )
)
```
Ce patron ne résout pas à lui seul la sécurité Storage, les liens signés, les droits SQL, ni les règles métier du staff. Contrôler également les fonctions `SECURITY DEFINER`, les accès directs et les autres chemins de lecture.

## Traitement de la garde GO05
La garde historique `is_active=true AND deleted_at IS NOT NULL` a été supprimée du SQL préparatoire, car la décision métier est de **conserver** les suppressions logiques. Ne jamais réinitialiser `deleted_at` pour faire passer le préflight. Le test statique a été adapté, mais son exécution CI et les tests sur clone restent à confirmer. Conserver un échec explicite si une voie alternative expose ces lignes.

## Ordre d'exécution futur, sous validation séparée
1. Vérifier la récupération indépendante de la sauvegarde hors site et la restauration des octets Storage sur environnement isolé ; documenter les limites de reprise Auth/config.
2. Établir une matrice d'accès : anon, joueur, parent, coach, staff, propriétaire, admin ; actifs/inactifs ; document publié/brouillon/supprimé ; URL Storage directe/signée.
3. Sur clone isolé, tester la politique ci-dessus, les six policies joueur, les RPC privilégiées et les usages applicatifs. Tester explicitement les 22 documents supprimés avec des identités fictives.
4. Tester la corbeille admin séparément (lecture exceptionnelle, journalisation, restauration explicite) avant toute ouverture ; par défaut, aucune corbeille exposée.
5. Tester les liens signés déjà émis et les objets orphelins ; définir expiration/révocation et droits de consultation.
6. Vérifier CI, scénarios HTTP/PostgREST/Storage, contrôles d'accès mineurs et rollback sécurisé ; faire approuver une fenêtre d'intervention.
7. Seulement après GO écrit, préparer un SQL transactionnel versionné, exécuter sur production avec vérifications post-déploiement et surveillance.

## Critères d'acceptation
- 22/22 fiches historiques conservées sans mutation ; 0/22 visible par consultation ordinaire, quel que soit le rôle.
- Les documents actifs, non supprimés, publiés et d'audience autorisée restent accessibles aux rôles prévus.
- Les brouillons non supprimés sont accessibles seulement aux rôles métiers autorisés.
- Aucun accès indirect via Storage, lien signé, RPC ou service backend non contrôlé.
- RLS active sur les trois tables ciblées, sans régression des parcours joueur/parent/coach, après déploiement futur.
- Audit documenté et réversible ; aucune suppression physique automatique.

**État : procédure proposée uniquement. NO-GO migration et fusion maintenu.**

## Anomalie applicative à traiter séparément
Le service `src/services/manualGeneratedDocuments.ts` écrit `bucket_name='bcvb-library'` et un `storage_path` sans téléversement ; le bucket réel documenté est `Bcvb-library`. Ne pas déduire l'existence d'un fichier de ces seules colonnes. Définir explicitement le modèle « contenu inline » avant toute correction applicative, et éviter toute migration automatique des 22 fiches historiques.
