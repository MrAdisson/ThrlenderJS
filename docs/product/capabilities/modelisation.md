---
id: CAP-MODELISATION
title: Modélisation 3D
parent:
deprecated: false
---

Dans la vue 3D, sélectionner un cube ou un plan visible, puis activer **Edit Mode**. Les sommets sélectionnés apparaissent en orange. Un clic sélectionne un sommet et un clic dans le vide vide la sélection. Maintenir **Maj** pendant le clic pour ajouter ou retirer un sommet de la sélection. Les sommets sont visibles à travers le maillage.

Glisser le manipulateur **Move** pour déplacer tous les sommets sélectionnés ensemble. Les coutures restent jointives et les transformations de l’objet sont conservées. **Object Mode** rend le manipulateur à l’objet et efface la sélection de sommets. Changer d’objet ou masquer le maillage ferme aussi le mode Édition.

L’interface affiche la raison lorsque **Edit Mode** est indisponible. Seuls les cubes et les plans visibles dont l’échelle est non nulle sur chaque axe peuvent être édités. Les modèles FBX importés ne sont pas éditables dans cette version. Enregistrer puis rouvrir un fichier THRL conserve la forme modifiée et son éligibilité au mode Édition. [Code](../../../src/VertexEditSession.js)
