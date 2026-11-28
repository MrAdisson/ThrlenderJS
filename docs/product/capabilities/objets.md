---
id: CAP-OBJETS
title: Composer la scène
parent:
deprecated: false
order: 4
---

L’éditeur permet d’ajouter des formes, des lumières et des modèles FBX. Le panneau **Scene** présente leur hiérarchie et permet de déplier les groupes importés. Les repères et aides de l’éditeur sont exclus de l’arborescence.

**Inspector** permet de renommer l’élément sélectionné et de régler sa visibilité. Masquer un groupe masque ses descendants dans la vue. Les éléments masqués restent sélectionnables dans **Scene**. Les noms et les réglages de visibilité sont conservés à la sauvegarde et à la réouverture THRL.

**Edit → Duplicate selection** crée une copie du maillage sélectionné sous le même parent, au même emplacement, puis sélectionne la copie. Les modifications apportées aux propriétés de la copie, notamment sa position et sa couleur, sont indépendantes. La commande s’applique à un maillage à la fois. Les groupes, les lumières et les objets enfants du maillage sont hors du périmètre de la duplication.

**Object Mode** sert à transformer les éléments de la scène. Passer en **Edit Mode** dans la vue pour déplacer les sommets ou extruder une face d’un cube, d’un plan ou d’un maillage statique sélectionné dans un groupe FBX. L’édition s’applique à un seul maillage à la fois. [Modélisation 3D](modelisation.md)

**Edit → Undo** et **Edit → Redo** couvrent l’ajout de formes, de lumières et de modèles FBX, la suppression, la duplication, les transformations et les modifications de maillage. Les commandes rétablissent une sélection valide. Pour une modification de maillage, elles sélectionnent l’objet et effacent la sélection de sommets ou de faces lors de la restauration en **Edit Mode**.

Toute nouvelle modification de la scène efface les opérations à rétablir. Les changements de nom, de visibilité, de matériau et d’éclairage ne créent pas d’entrée. L’ouverture d’un fichier THRL ou la création d’une scène réinitialise l’historique. La sauvegarde THRL conserve l’état de la scène. Après une annulation ou un rétablissement, l’éditeur indique que la scène a été modifiée depuis la dernière sauvegarde.
