#!/usr/bin/env python3
"""
Script pour créer des images placeholder pour la documentation
Utilise PIL pour générer des captures d'écran simulées
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Configuration
SCREENSHOTS_DIR = "docs/screenshots"
WIDTH = 1200
HEIGHT = 800
FONT_SIZE = 24

def create_placeholder_image(title, description, filename):
    """Créer une image placeholder avec titre et description"""
    
    # Créer l'image
    img = Image.new('RGB', (WIDTH, HEIGHT), color='#f8fafc')
    draw = ImageDraw.Draw(img)
    
    # Essayer de charger une police par défaut
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", FONT_SIZE + 8)
        font_desc = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", FONT_SIZE - 4)
    except:
        try:
            font_title = ImageFont.truetype("arial.ttf", FONT_SIZE + 8)
            font_desc = ImageFont.truetype("arial.ttf", FONT_SIZE - 4)
        except:
            font_title = ImageFont.load_default()
            font_desc = ImageFont.load_default()
    
    # Couleurs ClockPilot
    bg_gradient = '#3b82f6'  # Bleu
    text_color = '#1f2937'   # Gris foncé
    accent_color = '#ef4444' # Rouge
    
    # Dessiner un header coloré
    draw.rectangle([0, 0, WIDTH, 100], fill=bg_gradient)
    
    # Titre principal
    title_bbox = draw.textbbox((0, 0), title, font=font_title)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (WIDTH - title_width) // 2
    draw.text((title_x, 30), title, fill='white', font=font_title)
    
    # Description
    desc_bbox = draw.textbbox((0, 0), description, font=font_desc)
    desc_width = desc_bbox[2] - desc_bbox[0]
    desc_x = (WIDTH - desc_width) // 2
    draw.text((desc_x, 200), description, fill=text_color, font=font_desc)
    
    # Simuler une interface avec des rectangles
    # Navigation
    draw.rectangle([50, 150, WIDTH-50, 180], outline='#e5e7eb', width=2)
    
    # Contenu principal
    draw.rectangle([100, 250, WIDTH-100, HEIGHT-100], outline='#e5e7eb', width=2)
    
    # Boutons simulés
    draw.rectangle([120, 270, 250, 310], fill=accent_color)
    draw.text((135, 285), "Action", fill='white', font=font_desc)
    
    # Texte d'exemple
    draw.text((120, 350), "Interface ClockPilot", fill=text_color, font=font_desc)
    draw.text((120, 380), "Gestion des temps et planning", fill='#6b7280', font=font_desc)
    
    # Footer avec logo simulé
    draw.text((50, HEIGHT-50), "© 2024 ClockPilot", fill='#9ca3af', font=font_desc)
    
    # Sauvegarder
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    img.save(filename, 'PNG')
    print(f"✅ Image créée: {filename}")

def create_all_placeholders():
    """Créer toutes les images placeholder"""
    
    images = [
        # Login
        ("docs/screenshots/login/login-page.png", "Page de Connexion", "Saisissez vos identifiants pour accéder à ClockPilot"),
        ("docs/screenshots/login/login-error.png", "Erreur de Connexion", "Identifiants incorrects - Vérifiez votre email et mot de passe"),
        ("docs/screenshots/login/login-success.png", "Connexion Réussie", "Redirection vers votre tableau de bord..."),
        
        # Employé
        ("docs/screenshots/employee/dashboard.png", "Tableau de Bord Employé", "Vue d'ensemble de votre activité et planning"),
        ("docs/screenshots/employee/planning-month.png", "Planning Mensuel", "Consultez votre planning sur un mois complet"),
        ("docs/screenshots/employee/time-tracking.png", "Pointage Temps Réel", "Enregistrez vos heures de travail en temps réel"),
        ("docs/screenshots/employee/manual-entry.png", "Saisie Manuelle", "Ajoutez des heures de travail manuellement"),
        ("docs/screenshots/employee/reports.png", "Rapports Personnels", "Analysez vos statistiques de travail"),
        ("docs/screenshots/employee/profile.png", "Profil Utilisateur", "Gérez vos informations personnelles et préférences"),
        
        # Admin
        ("docs/screenshots/admin/dashboard.png", "Tableau de Bord Admin", "Vue d'ensemble de l'activité de l'entreprise"),
        ("docs/screenshots/admin/employees-list.png", "Gestion des Employés", "Consultez et administrez votre équipe"),
        ("docs/screenshots/admin/employee-create.png", "Création d'Employé", "Ajoutez un nouveau membre à l'équipe"),
        ("docs/screenshots/admin/validation.png", "Validation des Heures", "Approuvez ou rejetez les heures saisies"),
        ("docs/screenshots/admin/export-dialog.png", "Export de Données", "Générez des rapports personnalisés"),
    ]
    
    print("🖼️  Création des images placeholder pour la documentation...")
    
    for filename, title, description in images:
        create_placeholder_image(title, description, filename)
    
    print("✅ Toutes les images placeholder ont été créées!")

if __name__ == "__main__":
    create_all_placeholders()