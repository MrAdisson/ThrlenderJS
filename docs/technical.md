# Technique

<!-- builder:stack -->
## Stack et raisons

JavaScript et Three.js assurent l’édition et le rendu WebGL. lil-gui construit le panneau de réglages. Vite sert les modules en développement et compile les fichiers statiques. npm et le verrou de dépendances définissent l’installation. [README](../README.md) · [Manifeste](../package.json)

<!-- builder:architecture -->
## Architecture

La page HTML charge main.js, qui initialise le moteur partagé, les menus et les gestionnaires souris et clavier. ThrlenderEngine possède la scène, la caméra, le rendu et les contrôles Three.js. La boucle requestAnimationFrame actualise l’orbite, applique les changements de configuration et rend la scène. [Point d’entrée](../src/main.js) · [Moteur](../src/ThrlenderEngine.js)

<!-- builder:data -->
## Données

La scène et les réglages vivent en mémoire dans le navigateur. La sauvegarde télécharge le JSON Three.js sous forme de fichier .thrl. Le chargement THRL et l’import FBX lisent des fichiers locaux avec FileReader. Le dépôt ne déclare aucun stockage serveur. [Moteur](../src/ThrlenderEngine.js)

<!-- builder:environments -->
## Environnements et hébergement

Le README indique npm run dev pour le développement. npm run build produit dist avec la base /ThrlenderJS/ et des sourcemaps. Le workflow GitHub Pages utilise Node 18 et publie dist. npm run deploy compile avec la base / directement dans /var/www/thrlender. Le profil App Builder utilise la compilation standard et sert dist avec Vite Preview. [Configuration standard](../vite.config.js) · [Configuration de production](../vite.config.prod.js) · [Workflow](../.github/workflows/static.yml) · [Profil](../.builder/project.yml)

<!-- builder:conventions -->
## Conventions

Le code se trouve sous src et utilise les modules JavaScript. La configuration Prettier définit une indentation de deux espaces, des apostrophes, des points-virgules et une largeur de 120. La scène nomme les éléments utiles à la sélection et à la reconstruction des repères. [Prettier](../.prettierrc) · [Configuration de la scène](../src/utils/config.js)

<!-- builder:quality -->
## Qualité

Le workflow de publication lance la compilation. Le dépôt ne contient pas de suite automatisée. npm test affiche un message indiquant cette absence et quitte avec le code 1. Le manifeste ne déclare aucune commande de lint ou de vérification des types. [Manifeste](../package.json) · [Workflow](../.github/workflows/static.yml)

<!-- builder:security -->
## Sécurité et données personnelles

L’application s’exécute côté navigateur. Les commandes de fichiers lisent un document choisi sur le poste ou déclenchent un téléchargement local. Le dépôt ne définit ni compte, ni authentification, ni télémétrie applicative. [Moteur](../src/ThrlenderEngine.js) · [Point d’entrée](../src/main.js)

<!-- builder:services -->
## Services externes

GitHub Actions et GitHub Pages interviennent dans la publication statique. Le registre npm fournit les dépendances à l’installation. Le code de l’éditeur ne configure aucun service applicatif distant ni base de données, cache, file ou serveur de courriel. [Workflow](../.github/workflows/static.yml) · [Verrou npm](../package-lock.json)
