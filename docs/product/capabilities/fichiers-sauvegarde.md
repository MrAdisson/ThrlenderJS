---
id: CAP-FICHIERS-SAUVEGARDE
title: "Télécharger la scène"
parent: CAP-FICHIERS
deprecated: false
---

Save télécharge un fichier scene.thrl contenant le JSON de la scène Three.js. La grille, les axes et le manipulateur sont retirés pendant la sérialisation puis remis en place. Le fichier ne contient pas une sauvegarde distincte des réglages d’interface ou de la navigation.

La scène reste ouverte après le téléchargement et les repères restent disponibles dans la vue.

Code : [ThrlenderEngine.js](../../../src/ThrlenderEngine.js), [debug/debug.js](../../../src/debug/debug.js)
