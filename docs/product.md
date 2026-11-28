# Produit

<!-- builder:pitch -->
## Pitch

Thrlender est un éditeur de scènes 3D dans le navigateur, inspiré de Blender. Il permet de composer une scène à partir de formes, de lumières et de modèles FBX, puis de l’enregistrer localement. [README](../README.md)

<!-- builder:problem -->
## Problème

<!-- builder:audience -->
## Public et personas

<!-- builder:value -->
## Valeur

<!-- builder:principles -->
## Principes produit

<!-- builder:scope -->
## Périmètre

La version actuelle couvre la navigation 3D, la composition et l’éclairage d’une scène, les transformations d’objets, le déplacement de sommets des cubes et des plans, les repères visuels, les fichiers de scène THRL et l’import FBX. L’éditeur travaille sur une seule scène active dans une seule page. [Carte des capacités](product/capabilities/)

<!-- builder:journeys -->
## Parcours clés

1. Choisir une forme et une couleur dans **Add**, activer **Add to scene**, puis placer la forme avec le manipulateur ou **Inspector**.
2. Ajouter une lumière et régler ses propriétés dans **Inspector**. Ouvrir **Scene Settings** pour régler la lumière du ciel, même sans sélection. La sauvegarde THRL conserve ces réglages. Utiliser **View** pour régler la grille, les axes et le mode filaire. Le menu **Edit** permet de supprimer l’élément sélectionné après confirmation.
3. Dans **Scene**, déplier un groupe importé et sélectionner un élément. Dans **Inspector**, modifier son nom ou sa visibilité. Dupliquer un maillage avec **Edit → Duplicate selection**, puis cadrer la copie avec **View → Focus selection**. Choisir le pas de déplacement avec **View → Move snap step** et activer **Snap** dans la barre d’outils.
4. Dans **File**, ajouter un modèle avec **Import FBX**, télécharger la scène avec **Save THRL**, repartir de la scène initiale avec **New Scene** ou choisir un fichier avec **Open THRL**. Ces deux commandes demandent une confirmation si la scène active comporte des modifications non enregistrées. [Interface](../src/app/App.tsx)

5. Sélectionner un cube ou un plan et activer **Edit Mode**. Sélectionner les sommets à déplacer avec le clic et **Maj + clic**, déplacer la sélection avec **Move**, puis revenir en **Object Mode**. Sauvegarder la scène en THRL pour retrouver la forme modifiée à la réouverture. [Modélisation 3D](product/capabilities/modelisation.md)

<!-- builder:success -->
## Mesures de succès
