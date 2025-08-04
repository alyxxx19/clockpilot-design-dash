# validation-flow.gif

Flux de validation

Ce GIF sera généré automatiquement lors de la capture des workflows.

Pour générer les vrais GIFs :
1. Capturer les séquences d'actions avec Playwright
2. Convertir en GIF avec imagemagick ou ffmpeg
3. Optimiser avec gifsicle

Commande exemple :
convert frame*.png -delay 100 -loop 0 validation-flow.gif
gifsicle --optimize=3 --colors=64 validation-flow.gif -o validation-flow.gif
