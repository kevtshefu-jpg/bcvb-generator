# Player Books : intégrité et limites de sécurité (P10.6)

## État vérifié dans le code

Les fonctions d’agrégation et de génération PDF/XLSX existent. Aucun appel à ces générateurs n’est actuellement raccordé à une page routée. Leurs tests ne prouvent donc pas un parcours de téléchargement connecté en production.

Le snapshot conserve désormais l’identifiant canonique de l’équipe. Chaque test, observation de monitoring et programme doit correspondre exactement au joueur, à l’équipe et à la saison du livre. L’agrégation refuse un mélange ; les deux générateurs contrôlent de nouveau ce périmètre avant de produire le document, y compris pour un snapshot construit directement ou modifié après agrégation.

Erreurs : `PLAYER_BOOK_SCOPE_MISSING`, `PLAYER_BOOK_SOURCE_MALFORMED`, `PLAYER_BOOK_SOURCE_SCOPE_MISMATCH`. Une erreur empêche la génération ; elle ne transforme pas une source invalide en liste vide.

Les lectures détaillées Supabase peuvent retourner plusieurs saisons. Un futur appelant doit sélectionner explicitement les données de la saison canonique avant agrégation, sans réétiqueter une ancienne observation avec la saison actuelle. Les versions de snapshot sans `player.teamId` doivent être reconstruites depuis le profil canonique ; aucune équipe n’est devinée depuis son nom.

## Destinataires

Seules les valeurs existantes `joueur`, `parent`, `staff` sont acceptées. Cette valeur est une étiquette de présentation, pas une preuve d’identité ni un contrôle d’accès. La vérification de périmètre ne remplace pas non plus une autorisation serveur.

Le monitoring reste exclu des exports pour les trois destinataires. P10.6 n’accorde aucun accès supplémentaire et ne définit aucun consentement, droit parental ou politique de conservation.

Avant de raccorder une distribution à un joueur ou parent, il reste à établir le lien canonique entre compte, joueur et destinataire, vérifier les droits côté serveur et arrêter les règles métier/juridiques de diffusion. Le rôle `parent_referent` d’une équipe ne suffit pas à prouver une relation parent-enfant.

Le contrat de format mentionne DOCX, mais aucun générateur DOCX n’est implémenté. PDF/XLSX seuls sont testés ici.

## Validation

`playerBookScopeIntegrity.test.ts` vérifie les mélanges joueur/équipe/saison dans chaque source, les trois destinataires, les deux entrées PDF/XLSX, les périmètres manquants, les sources malformées et les modifications après agrégation. Les cas autorisés vérifient le texte PDF source et le classeur XLSX relu. Les tests de confidentialité monitoring restent exécutés dans la CI.
