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