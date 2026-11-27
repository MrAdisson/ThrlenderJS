---
id: CAP-FICHIERS-OUVERTURE
title: "Ouvrir une scène THRL"
parent: CAP-FICHIERS
deprecated: false
---

Load lit le JSON d’un fichier .thrl et remplace la scène courante. La grille, les axes, le manipulateur et des aides pour les lumières sont recréés. La caméra active reste celle de la session. Aucun message applicatif ne traite les erreurs de lecture ou de format.

L’ouverture efface la sélection en cours et conserve le mode du manipulateur.

Code : [ThrlenderEngine.js](../../../src/ThrlenderEngine.js), [debug/debug.js](../../../src/debug/debug.js)
