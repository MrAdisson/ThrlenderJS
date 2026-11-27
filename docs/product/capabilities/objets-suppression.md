---
id: CAP-OBJETS-SUPPRESSION
title: "Supprimer l’élément sélectionné"
parent: CAP-OBJETS
---

La commande removeSelectedObject est proposée dans le panneau de la sélection. La suppression est conçue pour un maillage simple et libère son matériau et sa géométrie. Pour une lumière, l’élément est retiré avant que cet accès à un matériau absent interrompe la commande. Son aide peut rester dans la scène. Aucun historique d’annulation n’est exposé.

Code : [debug/debug.js](../../../src/debug/debug.js), [ThrlenderEngine.js](../../../src/ThrlenderEngine.js)
