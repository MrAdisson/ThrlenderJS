---
id: CAP-MODELISATION
title: Modélisation 3D
parent:
deprecated: false
---

Dans la vue 3D, sélectionner un cube ou un plan visible, puis activer **Edit Mode**. Dans **Vertices**, les sommets sélectionnés apparaissent en orange. Un clic sélectionne un sommet et un clic dans le vide vide la sélection. Maintenir **Maj** pendant le clic pour ajouter ou retirer un sommet de la sélection. Les sommets sont visibles à travers le maillage.

Glisser le manipulateur **Move** pour déplacer tous les sommets sélectionnés ensemble. Les coutures restent jointives et les transformations de l’objet sont conservées. **Object Mode** rend le manipulateur à l’objet et efface la sélection de sommets. Changer d’objet ou masquer le maillage ferme aussi le mode Édition.

Dans **Faces**, un clic sélectionne une face entière et la surligne. Chaque côté du cube et la surface du plan se sélectionnent en un seul clic. **Extrude** affiche un aperçu d’extrusion d’une seule face le long de sa normale. **Distance** accepte une valeur positive dans les unités locales du maillage. **Apply** crée la face déplacée et ses parois latérales. Le cube reste fermé et le plan extrudé garde une base ouverte. **Cancel** rétablit la forme initiale. La sauvegarde utilise la dernière forme validée.

L’interface affiche la raison lorsque **Edit Mode** est indisponible. Seuls les cubes et les plans visibles dont l’échelle est non nulle sur chaque axe peuvent être édités. Les modèles FBX importés ne sont pas éditables dans cette version. Enregistrer puis rouvrir un fichier THRL conserve la forme modifiée et permet de modifier les nouveaux sommets ou d’extruder à nouveau la face. [Code](../../../src/VertexEditSession.js)
