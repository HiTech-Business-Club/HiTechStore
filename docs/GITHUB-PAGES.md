# GitHub Pages Configuration

Ce projet utilise GitHub Pages pour la documentation et la démo.

## URL de la démo
https://hitech-business-club.github.io/HiTechStore/

## Configuration

Le dossier `docs/` contient les fichiers pour GitHub Pages:
- `index.html` - Page de démonstration principale
- `.nojekyll` - Désactive le traitement Jekyll

## Déploiement automatique

Le déploiement se fait automatiquement à chaque push sur la branche `main` grâce à GitHub Actions.

Pour activer GitHub Pages:
1. Aller dans Settings > Pages
2. Source: Deploy from a branch
3. Branch: main, folder: /docs
4. Click Save