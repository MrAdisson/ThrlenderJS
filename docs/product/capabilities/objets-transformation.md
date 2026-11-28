---
id: CAP-OBJETS-TRANSFORMATION
title: Déplacer, tourner et redimensionner la sélection
parent: CAP-OBJETS
deprecated: false
order: 6
---

La barre d’outils de la vue contient **Move**, **Rotate** et **Scale**. Le mode actif est mis en évidence. Chaque icône porte un nom accessible et affiche une infobulle avec son raccourci lorsqu’il existe. **Gizmo** le bascule et **Snap** règle l’accrochage. Depuis la vue, **T**, **R**, **S** et **Espace** ont le même effet sur le mode et l’activation du manipulateur. Ces raccourcis sont actifs lorsque la vue 3D a le focus et restent inactifs pendant la saisie dans les champs. L’orbite est suspendue pendant le glissement du manipulateur.

**View → Move snap step** propose 0,1, 0,25, 0,5, 1, 2 et 5 unités pour les déplacements à la souris avec **Snap** actif. Le pas choisi reste disponible lorsqu’on désactive puis réactive **Snap**. La rotation et l’échelle utilisent respectivement 15 degrés et 0,25. La création ou l’ouverture d’une scène rétablit le mode **Move** et l’accrochage à 1 unité.

Dans une hiérarchie, la rotation ou l’échelle du parent peut décaler les points d’accrochage par rapport à la grille mondiale.

En **Object Mode**, le manipulateur transforme l’objet sélectionné. En **Edit Mode**, seul **Move** est disponible et le manipulateur déplace les sommets sélectionnés. **Gizmo**, **Snap** et le pas de déplacement s’appliquent aussi aux sommets. Le retour en **Object Mode** rétablit l’outil de transformation d’objet précédemment choisi. [Modélisation 3D](modelisation.md)

Un glisser effectif du manipulateur compte pour une seule opération dans **Edit → Undo** et **Redo**, en mode Objet comme en mode Édition. Les modifications de position et d’échelle dans **Inspector** sont aussi réversibles. En mode Édition, **Apply** enregistre une seule opération d’extrusion. Ajuster **Distance** pendant l’aperçu ou choisir **Cancel** ne crée pas d’entrée. Ces commandes s’appliquent aussi aux maillages FBX statiques éditables.

Quand la vue 3D a le focus, **Ctrl+Z** ou **Cmd+Z** annule. **Ctrl+Maj+Z**, **Cmd+Maj+Z** ou **Ctrl+Y** rétablit.
