---
id: CAP-OBJETS-TRANSFORMATION
title: "Déplacer, tourner et redimensionner la sélection"
parent: CAP-OBJETS
deprecated: false
---

Le manipulateur propose translation, rotation et échelle, accessibles dans le panneau ou avec T, R et S. Espace bascule le manipulateur. L’accrochage est activé au départ et réglable, avec des pas de 1 unité, 15 degrés et 0,25 en échelle. L’orbite est désactivée pendant le glissement du manipulateur.

Le mode du manipulateur reste actif lorsque la scène est remplacée depuis Load.

Code : [ThrlenderEngine.js](../../../src/ThrlenderEngine.js), [eventManager.js](../../../src/eventManager.js), [debug/debug.js](../../../src/debug/debug.js), [utils/config.js](../../../src/utils/config.js), [mountEditor.ts](../../../src/app/mountEditor.ts)
