# Étape 2 — Contrôle d'accès Storage et lectures indirectes (préparation, NON DÉPLOYÉE)

## Faits établis
- Bucket Storage réel privé : `Bcvb-library` ; des références applicatives utilisent `bcvb-library` (casse différente).
- Huit objets réels inventoriés : un lié à un document supprimé logiquement, sept non rattachés. Les documents historiques avec `content` inline peuvent contenir des `storage_path` fictifs.
- Le service `src/services/manualGeneratedDocuments.ts` écrit du contenu inline et un chemin fictif sans upload. Il ne faut ni déduire la présence d'un objet, ni renommer automatiquement le bucket.
- GO05 : aucun document avec `deleted_at IS NOT NULL` ne doit être lisible dans les parcours ordinaires, même par le staff.
- Le SQL de la PR #110 traite les trois tables `public`, **pas** `storage.objects`.

## Risques et règles d'implémentation
1. La lecture `storage.objects` doit être refusée par défaut pour `Bcvb-library` si l'objet n'est pas lié à une fiche **active, non supprimée** et autorisée pour le rôle ; toute policy permissive supplémentaire doit être auditée, car les policies RLS permissives se combinent par OR.
2. Ne pas utiliser uniquement `TO authenticated` : cela n'est pas une autorisation documentaire. La correspondance exacte doit porter sur `bucket_id`, `name`, `library_documents.bucket_name`, `library_documents.storage_path` et le droit effectif sur la fiche.
3. Le filtrage des fiches doit tenir compte de `deleted_at`, `is_active`, `status`, `audience`, du rôle actif et de la propriété. Les privilèges `service_role` peuvent contourner RLS : contrôler les endpoints serveurs séparément.
4. Les URL signées déjà émises doivent être traitées comme un risque résiduel ; leur durée de vie et leur invalidation ne sont pas garanties par le seul changement de policy.
5. Éviter d'ouvrir un bucket public. Les objets orphelins et les chemins fictifs doivent être refusés sans suppression automatique.
6. Toute fonction `SECURITY DEFINER` et toute vue liée aux documents doit être inventoriée ; le contrôle sur les documents ne doit pas être contournable via RPC/export.
7. **Ne pas** créer de policy SQL avant vérification des colonnes, des noms exacts des policies Storage existantes et des grants sur le clone.

## Matrice de tests obligatoire
- Anonyme, joueur, parent, coach, administrateur, utilisateur inactif : téléchargement, listing, signature d'URL et tentative de lecture d'objet sans fiche.
- Objet lié à fiche supprimée : refus pour **tous** les rôles en consultation ordinaire.
- Objet orphelin : refus pour tous.
- Objet lié à fiche publiée et autorisée : succès pour le rôle éligible, refus pour les autres.
- Fiche inline / chemin fictif : aucune tentative de téléchargement présumée réussie.
- Vérifier les endpoints privilégiés, exports et les URL signées déjà existantes.

## Validation de sortie
Un SQL Storage doit d'abord être testé transactionnellement sur clone ; puis tests HTTP/JWT/Storage sur environnement Supabase isolé, régression des usages légitimes, restauration démontrée et nouvelle CI verte. Le clone PostgreSQL seul ne suffit pas à tester le service Storage HTTP.

**Statut : NO-GO — aucune modification de production autorisée par ce document.**

Documentation Supabase : https://supabase.com/docs/guides/storage/security/access-control et https://supabase.com/docs/guides/storage/buckets/fundamentals.
