# Technique

<!-- builder:stack -->
## Stack et raisons

React et TypeScript portent l’interface d’édition. Le moteur existant utilise JavaScript et Three.js 0.159 pour l’édition et le rendu WebGL. Vite sert les modules en développement et compile les fichiers statiques. npm et le verrou de dépendances définissent l’installation. [README](../README.md) · [Manifeste](../package.json)

<!-- builder:architecture -->
## Architecture

La page HTML charge `main.tsx`, qui monte React. Le composant `App` fournit le conteneur de l’éditeur à `mountEditor`. Ce module utilise un contrat TypeScript pour initialiser une instance du moteur, ses réglages, les menus et les gestionnaires historiques. Un observateur ajuste le canevas et la projection aux dimensions du conteneur. La boucle `requestAnimationFrame` applique les changements de configuration, actualise l’orbite et rend la scène. Au démontage, le raccordement arrête la boucle et libère l’observateur, les interfaces et les écouteurs. Le moteur JavaScript libère les contrôles, les lectures locales en cours et les ressources Three.js de la scène et du rendu. [Point d’entrée](../src/main.tsx) · [Montage de l’éditeur](../src/app/mountEditor.ts) · [Moteur](../src/ThrlenderEngine.js)

<!-- builder:data -->
## Données

Le document de scène en mémoire regroupe le contenu Three.js, les réglages de lumière du ciel portés par la scène et le suivi des modifications. Les préférences d’affichage, la caméra de navigation, la sélection et les réglages du manipulateur appartiennent à l’éditeur. La création et l’ouverture remplacent le document au même endroit, réinitialisent les contrôles liés à la scène et conservent les préférences d’affichage. La sauvegarde télécharge le JSON Three.js sous forme de fichier .thrl. Le chargement THRL et l’import FBX lisent des fichiers locaux avec FileReader. Le dépôt ne déclare aucun stockage serveur. [Moteur](../src/ThrlenderEngine.js)

<!-- builder:environments -->
## Environnements et hébergement

Le README indique npm run dev pour le développement. npm run build produit dist avec la base /ThrlenderJS/ et des sourcemaps. Le workflow GitHub Pages utilise Node 18 et publie dist. npm run deploy compile avec la base / directement dans /var/www/thrlender. Le profil App Builder installe explicitement les dépendances de développement en staging pour disposer de TypeScript pendant la compilation standard, puis sert dist avec Vite Preview. [Configuration standard](../vite.config.js) · [Configuration de production](../vite.config.prod.js) · [Workflow](../.github/workflows/static.yml) · [Profil](../.builder/project.yml)

<!-- builder:conventions -->
## Conventions

Le code se trouve sous `src`. Les modules React et leur raccordement à l’éditeur utilisent TypeScript en mode strict. Le moteur et les gestionnaires de la vue restent en JavaScript. La configuration Prettier définit une indentation de deux espaces, des apostrophes, des points-virgules et une largeur de 120. La scène nomme les éléments utiles à la sélection et à la reconstruction des repères. [Prettier](../.prettierrc) · [Configuration de la scène](../src/utils/config.js)

<!-- builder:quality -->
## Qualité

Les commandes `npm run build` et `npm run deploy` vérifient les types avec `npm run typecheck` avant de compiler. App Builder exécute aussi la vérification des types. `npm test` vérifie les chemins de sortie et les URL des ressources des deux bundles, et le comportement de l’éditeur dans Chromium. Playwright Core exécute aussi les tests de l’éditeur dans Chromium, avec `CHROME_PATH` ou un Chromium déjà installé pour Playwright. [Manifeste](../package.json) · [Workflow](../.github/workflows/static.yml)

<!-- builder:security -->
## Sécurité et données personnelles

L’application s’exécute côté navigateur. Les commandes de fichiers lisent un document choisi sur le poste ou déclenchent un téléchargement local. Le dépôt ne définit ni compte, ni authentification, ni télémétrie applicative. [Moteur](../src/ThrlenderEngine.js) · [Point d’entrée](../src/main.tsx)

<!-- builder:services -->
## Services externes

GitHub Actions et GitHub Pages interviennent dans la publication statique. Le registre npm fournit les dépendances à l’installation. Le code de l’éditeur ne configure aucun service applicatif distant ni base de données, cache, file ou serveur de courriel. [Workflow](../.github/workflows/static.yml) · [Verrou npm](../package-lock.json)
