# Décisions

<!-- builder:decisions -->
## Décisions prises

L’historique enregistre en décembre 2023 la mise en place d’un éditeur JavaScript et Three.js, puis l’ajout des lumières, des ombres et des menus. Le moteur a ensuite été regroupé dans ThrlenderEngine avant l’ajout de la sauvegarde et du chargement THRL, puis de l’import FBX. La publication GitHub Pages et une compilation à la racine pour la production ont été configurées séparément. [Moteur](../src/ThrlenderEngine.js) · [Workflow Pages](../.github/workflows/static.yml) · [Configuration de production](../vite.config.prod.js)

<!-- builder:open-questions -->
## Questions ouvertes

<!-- builder:glossary -->
## Glossaire

- **THRL**. Extension du fichier JSON sérialisé par Three.js pour sauvegarder une scène.
- **FBX**. Format de modèle lu par FBXLoader.
- **Manipulateur**. Contrôle 3D de translation, rotation et échelle de la sélection.
- **Lumière du ciel**. Lumière hémisphérique par défaut, avec une couleur de ciel et une couleur de sol. [Moteur](../src/ThrlenderEngine.js)
