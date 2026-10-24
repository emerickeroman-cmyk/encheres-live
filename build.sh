#!/usr/bin/env bash
set -o errexit

# 1. Build du Frontend React
cd frontend
npm install
npm run build
cd ..

# 2. Build du Backend Django
pip install -r backend/requirements.txt
python backend/manage.py collectstatic --no-input
python backend/manage.py migrate

# 3. Création automatique du superutilisateur par défaut (si inexistant)
python backend/manage.py shell -c "
from django.contrib.auth.models import User;
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin1234');
    print('Superutilisateur par défaut créé avec succès !');
"