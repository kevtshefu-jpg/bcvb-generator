# BCVB — Décision à instruire : bibliothèque, fichiers Storage et suppression logique

**Statut : proposition de règles, NON VALIDÉE par le responsable technique.**
**Date : 21 octobre 2026.**
**Aucune migration, aucun changement de policy, aucune suppression et aucun accès aux fichiers n'est autorisé par ce document.**

## Faits vérifiés en lecture seule

| Indicateur | Valeur |
| --- | ---: |
| Fiches `library_documents` | 22 |
| Fiches avec `deleted_at IS NOT NULL` | 22 |
| Fiches avec `is_active = true` | 22 |
| Fiches `status = published` mais supprimées logiquement | 2 |
| Fiches avec texte intégré `content` | 21 |
| Fiches sans texte intégré | 1 |
| Objets dans le bucket privé réel `Bcvb-library` | 8 |
| Objets rattachés par chemin à une fiche | 1 |
| Objets rattachés à une fiche non supprimée | 0 |
| Objets non rattachés par chemin à une fiche | 7 |
| Objets avec propriétaire Storage renseigné (`owner` ou `owner_id`) | 0 |

Le nom de bucket enregistré dans les 22 fiches est `bcvb-library`, différent de `Bcvb-library` par la casse. Une policy Storage de lecture autorise tous les utilisateurs `authenticated` à lire les objets de `Bcvb-library` sans contrôle d'audience. `saveManualGeneratedDocument()` enregistre `content` en base et un chemin Storage **sans téléverser de fichier**. Le chemin enregistré ne prouve donc pas qu'un objet devrait exister.

## Principes de sécurité proposés (à valider)

1. **Suppression logique** : `deleted_at IS NOT NULL` signifie indisponible aux visiteurs, licenciés, parents, joueurs et coachs. Une corbeille réservée aux administrateurs est envisageable ; elle nécessite un circuit de restauration journalisé et testé.
2. **Brouillons** : les documents `uploaded` non publiés ne sont pas visibles par les joueurs ou parents. Les droits de consultation des coachs et dirigeants doivent être définis par le métier.
3. **Publication** : seule une fiche non supprimée, active, publiée et d'audience autorisée peut être distribuée ; une publication ne doit jamais être inférée du seul nom de bucket ou de la présence d'un fichier.
4. **Fichiers non rattachés** : les 7 objets sans fiche ne doivent être ni supprimés, ni rendus publics, ni transférés automatiquement. Accès minimal temporaire à décider avec l'administrateur ; inventaire privé hors dépôt et hors conversation.
5. **Fiches inline** : les 21 contenus texte ne doivent pas être dupliqués automatiquement en Storage. La lecture doit rester protégée par RLS sur `library_documents`.
6. **Fiche Storage-backed** : le seul document sans texte intégré et lié à un objet est supprimé logiquement ; ne pas rétablir sa diffusion avant décision de restauration.
7. **Comptes inactifs** : aucun accès aux documents internes ou fichiers du club, y compris par accès direct Storage, sauf accès légal explicitement défini.
8. **Mineurs** : ne jamais utiliser un lien signé longue durée comme substitut à un contrôle d'accès. Évaluer les délais d'expiration et la révocation des accès.

## Options pour les 7 objets non rattachés

| Option | Avantage | Risque / condition |
| --- | --- | --- |
| Quarantaine logique avec accès administratif uniquement | Confidentialité par défaut | Peut interrompre un usage existant ; vérifier les dépendances avant activation |
| Réconciliation avec de nouvelles fiches documentaires | Contrôle d'audience explicite | Exige une qualification métier de chaque objet et des tests |
| Suppression physique | Réduit le stockage | **Non autorisée** sans inventaire, conservation et sauvegarde restaurable |

**Orientation technique recommandée :** inventorier les usages et les propriétaires métiers dans un registre privé, puis appliquer une politique de moindre privilège sur un environnement isolé. Ne pas changer les policies de production avant validation du registre, des scénarios et du retour arrière.

## Scénarios d'acceptation à tester sur environnement isolé

| Scénario | Résultat attendu si les principes sont validés |
| --- | --- |
| Visiteur non connecté → document public publié et non supprimé | Lecture autorisée uniquement si la publication publique est explicitement validée |
| Joueur actif → document interne coach | Refus |
| Parent actif → document réservé aux parents, publié et non supprimé | Lecture selon audience et rattachement validés |
| Coach actif → brouillon d'un autre périmètre | À définir par le métier |
| Utilisateur inactif → objet Storage connu | Refus |
| Joueur actif → objet Storage connu mais non rattaché | Refus |
| Administrateur → objet en quarantaine | À valider selon registre privé |
| Tout utilisateur → fiche supprimée logiquement | Refus, hors corbeille admin dédiée si validée |
| Staff → URL signée précédemment délivrée après révocation | Définir le risque résiduel et la durée maximale |
| Document inline → téléchargement | Ne doit pas supposer qu'un objet Storage existe |
| Document Storage-backed → URL signée | Bucket, chemin, RLS, audience et statut cohérents |

## Dépendances et interdictions

- Sauvegarde **complète** et restauration vérifiée, incluant les composants Auth et Storage concernés.
- Tests PostgREST et Storage avec comptes fictifs, JWT dédiés et objets de test.
- Contrôle des accès directs aux objets, de la génération d'URL signées et des effets de bord sur les écrans.
- Validation explicite du responsable technique pour la corbeille, les droits coach/staff, le traitement des objets non rattachés et les exceptions.
- **Interdits à ce stade** : fusion ou déploiement PR #110, migration des objets, changement de policies Storage, suppression ou restauration de fiches, exposition des noms de fichiers ou données des licenciés.

Suivi : [PR #110](https://github.com/kevtshefu-jpg/bcvb-generator/pull/110), [issue #112](https://github.com/kevtshefu-jpg/bcvb-generator/issues/112), [issue #113](https://github.com/kevtshefu-jpg/bcvb-generator/issues/113).
