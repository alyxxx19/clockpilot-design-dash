# punch-process.gif

Processus de pointage

Ce GIF sera généré automatiquement lors de la capture des workflows.

Pour générer les vrais GIFs :
1. Capturer les séquences d'actions avec Playwright
2. Convertir en GIF avec imagemagick ou ffmpeg
3. Optimiser avec gifsicle

Commande exemple :
convert frame*.png -delay 100 -loop 0 punch-process.gif
gifsicle --optimize=3 --colors=64 punch-process.gif -o punch-process.gif
