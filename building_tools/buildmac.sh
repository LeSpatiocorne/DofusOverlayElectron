#!/bin/bash

# Supprimer le dossier dist et son contenu un niveau au-dessus
if [ -d "../dist" ]; then
    rm -rf "../dist"
fi

# Exécuter la commande de build pour macOS
npm run build:mac
