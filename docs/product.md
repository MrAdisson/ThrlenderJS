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

La version actuelle couvre la navigation 3D, la composition et l’éclairage d’une scène, les transformations d’objets, les repères visuels, les fichiers de scène THRL et l’import FBX. Les opérations se déroulent dans une seule page. [Carte des capacités](product/capabilities/)

<!-- builder:journeys -->
## Parcours clés

1. Choisir une forme et une couleur dans **Add**, activer **Add to scene**, puis placer la forme avec le manipulateur ou **Inspector**.
2. Ajouter une lumière, régler ses propriétés ou configurer la lumière du ciel dans la section **Lighting** du menu **View**. Le menu **Edit** permet de supprimer l’élément sélectionné après confirmation.
3. Dans **Scene**, déplier un groupe importé et sélectionner un élément. Dans **Inspector**, modifier son nom ou sa visibilité.
4. Dans **File**, ajouter un modèle avec **Import FBX**, télécharger la scène avec **Save THRL** ou confirmer son remplacement avec **Open THRL** avant de choisir le fichier. [Interface](../src/app/App.tsx)

<!-- builder:success -->
## Mesures de succès
