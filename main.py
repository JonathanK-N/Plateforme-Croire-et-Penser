#!/usr/bin/env python3
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import app, db, create_admin_user, init_thematic_categories

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))

    try:
        with app.app_context():
            print("Connexion à PostgreSQL...")
            db.create_all()

            # Migration: élargir les colonnes VARCHAR(500) -> TEXT
            print("Vérification migration colonnes TEXT...")
            for col in ['featured_image', 'video_url', 'audio_url']:
                try:
                    with db.engine.connect() as conn:
                        conn.execute(db.text(f'ALTER TABLE thematic_content ALTER COLUMN {col} TYPE TEXT USING {col}::TEXT'))
                        conn.commit()
                    print(f"Migration OK: {col} -> TEXT")
                except Exception as e:
                    print(f"Migration {col} (ignorée): {e}")

            create_admin_user()
            init_thematic_categories()
            print("Base de données initialisée")
    except Exception as e:
        print(f"Erreur DB (continuons quand même): {e}")

    print(f"Démarrage sur le port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)