---
id: CAP-FICHIERS-FBX
title: "Importer un modèle FBX"
parent: CAP-FICHIERS
deprecated: false
---

LoadFbx lit un fichier .fbx local et ajoute le groupe importé à la scène courante. L’import ne lance pas la lecture des animations et ne propose pas de réglages d’import ni de message applicatif en cas d’échec.

La scène courante reste en place pendant l’import.

Code : [ThrlenderEngine.js](../../../src/ThrlenderEngine.js), [debug/debug.js](../../../src/debug/debug.js)
