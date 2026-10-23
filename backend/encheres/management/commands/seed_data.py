"""
Commande d'initialisation : python manage.py seed_data
Crée un administrateur, des catégories, des utilisateurs et des articles de démonstration.
"""
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone

from encheres.models import Categorie, ArticleEnchere, Enchere


class Command(BaseCommand):
    help = "Peuple la base de données avec des données de démonstration."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Création des données de démonstration..."))

        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@encheres.mg', 'AdminEncheres2026!')
            self.stdout.write(self.style.SUCCESS("✔ Superutilisateur 'admin' / 'AdminEncheres2026!' créé."))

        vendeur, _ = User.objects.get_or_create(
            username='vendeur1', defaults={'email': 'vendeur1@encheres.mg', 'first_name': 'Rija'}
        )
        vendeur.set_password('Vendeur2026!')
        vendeur.save()

        acheteur, _ = User.objects.get_or_create(
            username='acheteur1', defaults={'email': 'acheteur1@encheres.mg', 'first_name': 'Fara'}
        )
        acheteur.set_password('Acheteur2026!')
        acheteur.save()

        categories_data = [
            ('Électronique', 'bi-laptop', '#6366f1'),
            ('Art & Antiquités', 'bi-palette', '#ec4899'),
            ('Véhicules', 'bi-car-front', '#f59e0b'),
            ('Mode & Accessoires', 'bi-bag-heart', '#10b981'),
            ('Immobilier', 'bi-house-door', '#3b82f6'),
            ('Bijoux', 'bi-gem', '#eab308'),
        ]
        categories = {}
        for nom, icone, couleur in categories_data:
            cat, _ = Categorie.objects.get_or_create(
                nom=nom, defaults={'icone': icone, 'couleur': couleur}
            )
            categories[nom] = cat

        now = timezone.now()
        articles_data = [
            ("MacBook Pro M3 16 pouces", "Électronique", 2200000, -1, 5),
            ("Toile abstraite signée", "Art & Antiquités", 450000, 0, 3),
            ("Toyota Land Cruiser 2019", "Véhicules", 85000000, 1, 10),
            ("Sac à main cuir vintage", "Mode & Accessoires", 320000, -2, 1),
            ("Villa vue mer Nosy Be", "Immobilier", 250000000, 2, 15),
            ("Bague en or 18 carats", "Bijoux", 1800000, -1, 4),
        ]

        for titre, cat_nom, prix, jours_debut, jours_duree in articles_data:
            debut = now + timedelta(days=jours_debut)
            fin = debut + timedelta(days=jours_duree)
            article, created = ArticleEnchere.objects.get_or_create(
                titre=titre,
                defaults={
                    'description': f"Lot de qualité : {titre}. Article vérifié et garanti par le vendeur.",
                    'prix_depart': prix,
                    'categorie': categories[cat_nom],
                    'vendeur': vendeur,
                    'date_debut': debut,
                    'date_fin': fin,
                }
            )
            if created:
                article.actualiser_statut()
                if article.statut == ArticleEnchere.Statut.ACTIVE:
                    Enchere.objects.create(article=article, encherisseur=acheteur, montant=prix * 1.1)

        self.stdout.write(self.style.SUCCESS("✔ Données de démonstration créées avec succès !"))
