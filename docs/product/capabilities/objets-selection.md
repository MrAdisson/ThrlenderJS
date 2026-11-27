---
id: CAP-OBJETS-SELECTION
title: "Sélectionner un élément"
parent: CAP-OBJETS
deprecated: false
---

Un clic dans la vue sélectionne le premier élément admissible touché, ou efface la sélection si aucun élément ne correspond. Un clic sur une aide lumineuse vise la lumière associée. Tab prend l’élément admissible de premier niveau le plus proche de la caméra, selon son nom et sa position. Tab et l’ajout attachent le manipulateur sans actualiser le panneau de propriétés comme le fait le clic. Le ciblage des maillages FBX dépend de leur structure et de leurs noms.

Le ciblage par clic suit la taille et la position de la vue 3D sur la page.

Code : [mouseManager.js](../../../src/mouseManager.js), [eventManager.js](../../../src/eventManager.js), [utils/config.js](../../../src/utils/config.js), [ThrlenderEngine.js](../../../src/ThrlenderEngine.js)
