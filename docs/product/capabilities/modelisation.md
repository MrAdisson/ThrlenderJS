---
id: CAP-MODELISATION
title: Modélisation 3D
parent:
deprecated: false
---

Sélectionner un cube ou un plan visible, ou déplier un groupe FBX dans **Scene** et sélectionner un maillage statique visible. Activer **Edit Mode** pour éditer ce maillage individuellement. Dans **Vertices**, les sommets sélectionnés apparaissent en orange. Un clic sélectionne un sommet et un clic dans le vide vide la sélection. Maintenir **Maj** pendant le clic pour ajouter ou retirer un sommet de la sélection. Les sommets sont visibles à travers le maillage.

Glisser le manipulateur **Move** pour déplacer tous les sommets sélectionnés ensemble. Les coutures dont les sommets ont la même position locale à l’import restent jointives. Les transformations de l’objet sont conservées. **Object Mode** rend le manipulateur à l’objet et efface la sélection de sommets. Changer d’objet ou masquer le maillage ferme aussi le mode Édition.

Dans **Faces**, un clic sélectionne une face entière et la surligne. Chaque côté du cube et la surface du plan se sélectionnent en un seul clic. Sur un maillage FBX, chaque triangle importé est une face sélectionnable. **Extrude** affiche un aperçu d’extrusion d’une seule face le long de sa normale. **Distance** accepte une valeur positive dans les unités locales du maillage. **Apply** crée la face déplacée et ses parois latérales. Le cube reste fermé et le plan extrudé garde une base ouverte. **Cancel** rétablit la forme initiale. La sauvegarde utilise la dernière forme validée.

L’interface affiche la raison lorsque **Edit Mode** est indisponible. Le maillage doit être visible et avoir une échelle non nulle sur chaque axe. Les maillages avec squelette ou cibles de morphing restent disponibles en **Object Mode**. Enregistrer puis rouvrir un fichier THRL conserve la forme modifiée, la hiérarchie, les transformations et les matériaux. Il est possible de déplacer les nouveaux sommets ou d’extruder à nouveau une face. [Code](../../../src/VertexEditSession.js)
