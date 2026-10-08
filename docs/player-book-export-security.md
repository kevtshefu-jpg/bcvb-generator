# Player Books : intégrité et limites de sécurité (P10.6)

## État vérifié dans le code

Les fonctions d’agrégation et de génération PDF/XLSX existent. P11.1 les raccorde à `/coach/joueurs/:id/player-book`, réservé aux rôles admin, responsable technique, coach et team_staff. L’accès est également contrôlé par la RPC dédiée `read_player_staff_book`, qui vérifie les droits existants sur le joueur et son équipe. Le lien est disponible depuis le profil de progression. Les tests ne prouvent pas un parcours connecté en production.

Le snapshot conserve désormais l’identifiant canonique de l’équipe. Chaque test, observation de monitoring et programme doit correspondre exactement au joueur, à l’équipe et à la saison du livre. L’agrégation refuse un mélange ; les deux générateurs contrôlent de nouveau ce périmètre avant de produire le document, y compris pour un snapshot construit directement ou modifié après agrégation.

Erreurs : `PLAYER_BOOK_SCOPE_MISSING`, `PLAYER_BOOK_SOURCE_MALFORMED`, `PLAYER_BOOK_SOURCE_SCOPE_MISMATCH`. Une erreur empêche la génération ; elle ne transforme pas une source invalide en liste vide.

Les lectures détaillées Supabase peuvent retourner plusieurs saisons. Un futur appelant doit sélectionner explicitement les données de la saison canonique avant agrégation, sans réétiqueter une ancienne observation avec la saison actuelle. Les versions de snapshot sans `player.teamId` doivent être reconstruites depuis le profil canonique ; aucune équipe n’est devinée depuis son nom.

## Destinataires

Seules les valeurs existantes `joueur`, `parent`, `staff` sont acceptées. Cette valeur est une étiquette de présentation, pas une preuve d’identité ni un contrôle d’accès. La vérification de périmètre ne remplace pas non plus une autorisation serveur.

Le monitoring reste exclu des exports pour les trois destinataires. P10.6 n’accorde aucun accès supplémentaire et ne définit aucun consentement, droit parental ou politique de conservation.

Avant de raccorder une distribution à un joueur ou parent, il reste à établir le lien canonique entre compte, joueur et destinataire, vérifier les droits côté serveur et arrêter les règles métier/juridiques de diffusion. Le rôle `parent_referent` d’une équipe ne suffit pas à prouver une relation parent-enfant.

Le contrat de format mentionne DOCX, mais aucun générateur DOCX n’est implémenté. PDF/XLSX seuls sont testés ici.

## Parcours interne autorisé (P11.1)

Kevin a retenu le parcours interne coach/staff, sans diffusion familiale. La RPC retourne un snapshot cohérent de la saison canonique du profil : identité, compteurs d’évaluations/objectifs, résultats de tests et informations de programmes nécessaires aux exports existants. Elle ne lit pas le monitoring et n’inclut ni notes de tests, ni contenu des évaluations, ni sécurité détaillée/semaines/séances des programmes. Aucun destinataire familial n’est sélectionnable.

Le téléchargement recharge le snapshot depuis le serveur afin de vérifier à nouveau les droits. Une erreur de lecture interdit l’export ; aucun fallback vers des sources détaillées. Un changement de joueur ou la fermeture de la page annule les téléchargements en préparation. PDF/XLSX sont générés localement, sans sauvegarde persistante ni envoi à un tiers. Les autorisations sont vérifiées lors de la lecture ; cela ne permet pas de reprendre un fichier déjà téléchargé si les droits sont retirés ultérieurement.

## Audit des sources et destinataires (P10.7)

La table `player_contacts` contient des noms, téléphones et e-mails familiaux, sans relation canonique vers un compte parent. `players.owner_id` et les affectations d’équipe ne prouvent pas non plus une relation parent-enfant. Aucun modèle explicite de lien compte–parent–joueur n’a été trouvé dans les migrations et services inspectés. Cette absence bloque la diffusion parent/joueur, pas les correctifs de sécurité des sources existantes.

Les lectures d’évaluations et d’objectifs réutilisent désormais `can_read_player_performance_scope` et refusent toute permission différente de `true`. Joueur et équipe sont obligatoires à l’exécution (le paramètre SQL par défaut est conservé pour compatibilité de signature, mais `null` est refusé). Les appels applicatifs existants transmettent déjà les deux identifiants. Les sources disponibles mais vides restent des listes vides ; une réponse RPC malformée ou un refus d’accès n’est plus converti en absence de données. Le contenu et les écritures existants ne sont pas modifiés.

Les rôles déjà autorisés dans un périmètre valide restent inchangés. Cela ne transforme pas leur droit de lecture interne en droit d’envoi à une famille. L’activation d’une distribution nécessite encore une décision métier/juridique et un lien de destinataire vérifiable.

## Validation

`playerBookScopeIntegrity.test.ts` vérifie les mélanges joueur/équipe/saison dans chaque source, les trois destinataires, les deux entrées PDF/XLSX, les périmètres manquants, les sources malformées et les modifications après agrégation. Les cas autorisés vérifient le texte PDF source et le classeur XLSX relu. Les tests de confidentialité monitoring restent exécutés dans la CI.
