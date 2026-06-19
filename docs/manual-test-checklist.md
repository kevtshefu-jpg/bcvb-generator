# Checklist de test manuel — BCVB Référentiel

## Authentification
- [ ] Connexion admin
- [ ] Connexion responsable technique
- [ ] Connexion coach
- [ ] Connexion dirigeant
- [ ] Connexion parent référent
- [ ] Connexion membre
- [ ] Déconnexion
- [ ] Mot de passe oublié
- [ ] Redirection claire si les droits du profil ne sont pas chargés

## Inscription publique
- [ ] Ouvrir `/inscription`
- [ ] Soumettre une demande publique complète
- [ ] Tester une demande avec équipe/groupe renseigné
- [ ] Vérifier la ligne `registration_requests`
- [ ] Vérifier `registration_requests` si la table contient `requested_team`
- [ ] Vérifier la ligne `profile_requests`
- [ ] Vérifier que l’erreur legacy ne bloque pas le visiteur
- [ ] Vérifier que l’échec éventuel du mail ne bloque pas la demande
- [ ] Vérifier le message succès utilisateur

## Validation admin
- [ ] Ouvrir `/admin`
- [ ] Vérifier la carte prioritaire “Demandes de profils”
- [ ] Ouvrir `/admin/demandes-profils`
- [ ] Filtrer les demandes en attente
- [ ] Valider une demande
- [ ] Refuser une demande avec motif
- [ ] Marquer une demande comme traitée
- [ ] Recharger la page et vérifier la persistance du statut

## Navigation mobile
- [ ] Ouvrir le site en largeur mobile
- [ ] Vérifier la navigation principale
- [ ] Vérifier que les actions importantes restent visibles
- [ ] Vérifier que les tableaux admin sont remplacés par des cartes lisibles
- [ ] Vérifier que la bibliothèque ne nécessite pas de zoom horizontal

## Bibliothèque
- [ ] Ouvrir `/bibliotheque`
- [ ] Rechercher par titre
- [ ] Filtrer par famille documentaire
- [ ] Filtrer par catégorie
- [ ] Filtrer par audience
- [ ] Filtrer par saison
- [ ] Prévisualiser un document
- [ ] Ouvrir un document avec contenu intégré
- [ ] Ouvrir un document avec fichier associé
- [ ] Télécharger une source Markdown disponible
- [ ] Vérifier le message “Source indisponible” si aucune source n’existe
- [ ] Générer un PDF depuis un contenu Markdown
- [ ] Vérifier le fallback source/HTML si le moteur PDF échoue
- [ ] Vérifier l’affichage “Version actuelle”
- [ ] Vérifier l’état “Versions à venir” sans crash
- [ ] Transformer un document en document BCVB sans écraser l’original

## Studio documentaire
- [ ] Ouvrir `/admin/studio-editorial`
- [ ] Coller une source texte
- [ ] Importer une source OCR existante si disponible
- [ ] Vérifier la colonne source
- [ ] Modifier le document central
- [ ] Vérifier les recommandations qualité
- [ ] Sauvegarder automatiquement
- [ ] Recharger et vérifier la reprise du travail
- [ ] Transformer depuis `/admin/documents/transformer`

## Exports
- [ ] Ouvrir `/admin/qualite-exports`
- [ ] Lancer un score qualité
- [ ] Vérifier les sous-scores
- [ ] Lancer une micro-correction
- [ ] Lancer une amélioration forte
- [ ] Vérifier la création de version
- [ ] Exporter un PDF
- [ ] Télécharger la source conservée
- [ ] Restaurer une ancienne version si disponible

## Droits par rôle
- [ ] Admin : accès à l’administration sensible
- [ ] Admin : accès au Studio éditorial
- [ ] Responsable technique : accès aux modules coachs et pilotage sportif
- [ ] Responsable technique : pas d’accès aux réglages utilisateurs sensibles si non prévu
- [ ] Coach : accès séances, planifications, effectifs, présences, évaluations
- [ ] Coach : pas d’accès au Studio éditorial admin
- [ ] Dirigeant : accès documents club et pilotage
- [ ] Parent référent : accès logistique et présences utiles
- [ ] Membre : accès bibliothèque autorisée, tutoriels et FAQ
- [ ] Arbitre / OTM / bénévole : accès aux contenus publics ou club autorisés

## Exports et téléchargements rapides
- [ ] Générer PDF depuis un document riche
- [ ] Générer PDF depuis un document simple
- [ ] Télécharger source disponible
- [ ] Télécharger Markdown fallback
- [ ] Tester double clic sur Générer PDF
- [ ] Vérifier le message de chargement
- [ ] Vérifier l’erreur si aucune source disponible

## Suppression groupée
- [ ] Bibliothèque : sélectionner plusieurs documents
- [ ] Bibliothèque : annuler sélection
- [ ] Bibliothèque : supprimer avec confirmation
- [ ] Bibliothèque : vérifier rechargement
- [ ] Séances : sélectionner plusieurs séances si disponible
- [ ] Situations : sélectionner plusieurs situations si disponible
- [ ] Admin inscriptions : archiver/supprimer plusieurs demandes
- [ ] Admin profils : archiver/supprimer plusieurs demandes
- [ ] Vérifier mobile
- [ ] Vérifier desktop

## Sécurité actions groupées
- [ ] Aucun élément supprimé sans confirmation
- [ ] Les erreurs Supabase sont visibles
- [ ] Les demandes pending ont une confirmation renforcée
- [ ] Les actions groupées sont réservées aux bons rôles

## Anti-débordement visuel
- [ ] Les badges ne débordent pas dans `/bibliotheque`
- [ ] Les tags documents ne sortent pas des cartes
- [ ] Les statuts OK / critique / à surveiller restent lisibles
- [ ] Les cartes dirigeants ne débordent pas
- [ ] Les cartes club/pilotage ne débordent pas
- [ ] Les filtres tutoriels scrollent correctement
- [ ] Les onglets longs scrollent ou sont tronqués proprement
- [ ] Les boutons longs ne cassent pas la toolbar
- [ ] Aucun scroll horizontal global sur mobile
- [ ] Aucun scroll horizontal global sur MacBook Air
