@echo off

REM Supprimer le dossier dist et son contenu un niveau au-dessus
if exist ..\dist rmdir /s /q ..\dist

REM Exécuter la commande de build pour Windows
npm run build:win
