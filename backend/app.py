from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
import base64
import uuid
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

# Configuration Cloudinary pour le stockage des images
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

app = Flask(__name__, template_folder='../frontend/templates', static_folder='../frontend/static')
# Configuration base de données pour Railway
database_url = os.getenv('DATABASE_URL')
print(f"DATABASE_URL: {database_url}")  # Debug
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///foi_raison.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
print(f"Using database: {app.config['SQLALCHEMY_DATABASE_URI']}")  # Debug
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

def handle_image_field(value):
    """Si la valeur est une image base64, l'uploader sur Cloudinary et retourner l'URL permanente."""
    if not value or not str(value).startswith('data:image/'):
        return value
    # Vérifier que Cloudinary est configuré
    if not os.getenv('CLOUDINARY_CLOUD_NAME'):
        # Fallback: sauvegarder localement si Cloudinary non configuré
        try:
            header, data = value.split(',', 1)
            ext = header.split('/')[1].split(';')[0]
            filename = f"{uuid.uuid4()}.{ext}"
            upload_folder = app.config.get('UPLOAD_FOLDER', '/app/uploads')
            os.makedirs(upload_folder, exist_ok=True)
            filepath = os.path.join(upload_folder, filename)
            with open(filepath, 'wb') as f:
                f.write(base64.b64decode(data))
            return f'/uploads/{filename}'
        except Exception as e:
            print(f"Erreur sauvegarde image locale: {e}")
            return ''
    # Upload vers Cloudinary
    try:
        result = cloudinary.uploader.upload(
            value,
            folder='croire-et-penser',
            resource_type='image'
        )
        url = result.get('secure_url', '')
        print(f"Image uploadée sur Cloudinary: {url}")
        return url
    except Exception as e:
        print(f"Erreur upload Cloudinary: {e}")
        return ''

# Modèles de base de données
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    sexe = db.Column(db.String(1), nullable=False)
    telephone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    date_naissance = db.Column(db.Date, nullable=False)
    accepte_jesus = db.Column(db.String(3), nullable=False)
    baptise = db.Column(db.String(3), nullable=False)
    annee_bapteme = db.Column(db.Integer, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

class Content(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    content_type = db.Column(db.String(20), nullable=False)  # video, podcast, article
    file_path = db.Column(db.String(500))
    thumbnail = db.Column(db.String(500))
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    views = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=False)

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_approved = db.Column(db.Boolean, default=False)

class Answer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    content_id = db.Column(db.Integer, db.ForeignKey('content.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Nouveaux modèles pour le contenu thématique
class ThematicCategory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))
    order_index = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ThematicContent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey('thematic_category.id'), nullable=False)
    content_type = db.Column(db.String(20), nullable=False)  # article, video, podcast, study
    format_type = db.Column(db.String(20))  # carrousel, teaser, long-form, interactive
    publication_date = db.Column(db.DateTime)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    featured_image = db.Column(db.Text)
    reading_time = db.Column(db.Integer)  # en minutes
    views = db.Column(db.Integer, default=0)
    likes = db.Column(db.Integer, default=0)
    is_featured = db.Column(db.Boolean, default=False)
    is_published = db.Column(db.Boolean, default=False)
    meta_description = db.Column(db.String(160))
    tags = db.Column(db.Text)  # JSON array of tags
    video_url = db.Column(db.Text)  # URL vidéo YouTube/Vimeo
    audio_url = db.Column(db.Text)  # URL audio/podcast
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BiblicalReference(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book = db.Column(db.String(50), nullable=False)
    chapter = db.Column(db.Integer, nullable=False)
    verse_start = db.Column(db.Integer)
    verse_end = db.Column(db.Integer)
    text = db.Column(db.Text)
    version = db.Column(db.String(20), default='LSG')
    thematic_content_id = db.Column(db.Integer, db.ForeignKey('thematic_content.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Newsletter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    subscribed_at = db.Column(db.DateTime, default=datetime.utcnow)
    preferences = db.Column(db.Text)  # JSON preferences

class Testimony(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    author_name = db.Column(db.String(120), nullable=False)
    content = db.Column(db.Text)  # texte du témoignage
    media_type = db.Column(db.String(10), nullable=False)  # text, video, audio
    media_url = db.Column(db.String(500))  # URL vidéo/audio
    is_approved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ContentSeries(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('thematic_category.id'))
    total_episodes = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Routes d'authentification
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email déjà utilisé'}), 400
        
        # Convertir la date de naissance
        from datetime import datetime
        date_naissance = datetime.strptime(data['dateNaissance'], '%Y-%m-%d').date()
        
        user = User(
            nom=data['nom'],
            prenom=data['prenom'],
            sexe=data['sexe'],
            telephone=data['telephone'],
            email=data['email'],
            date_naissance=date_naissance,
            accepte_jesus=data['accepteJesus'],
            baptise=data['baptise'],
            annee_bapteme=int(data['anneeBapteme']) if data.get('anneeBapteme') else None,
            password_hash=generate_password_hash(data['password'])
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'Utilisateur créé avec succès'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erreur lors de l\'inscription: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['username']).first()  # Utiliser email comme username
    
    if user and check_password_hash(user.password_hash, data['password']) and user.is_active:
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(days=7)
        )
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': f"{user.prenom} {user.nom}",
                'role': user.role
            }
        })
    
    return jsonify({'message': 'Identifiants invalides'}), 401

# Routes de contenu
@app.route('/api/contents', methods=['GET'])
def get_contents():
    try:
        contents = Content.query.filter_by(is_published=True).order_by(Content.created_at.desc()).all()
        return jsonify([{
            'id': c.id,
            'title': c.title,
            'description': c.description,
            'content_type': c.content_type,
            'thumbnail': c.thumbnail,
            'views': c.views,
            'created_at': c.created_at.isoformat()
        } for c in contents])
    except Exception as e:
        print(f"Error loading contents: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/contents/<int:content_id>', methods=['GET'])
def get_content(content_id):
    content = Content.query.get_or_404(content_id)
    content.views += 1
    db.session.commit()
    
    return jsonify({
        'id': content.id,
        'title': content.title,
        'description': content.description,
        'content_type': content.content_type,
        'file_path': content.file_path,
        'views': content.views
    })

@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'Aucun fichier'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'Aucun fichier sélectionné'}), 400
    
    filename = secure_filename(file.filename)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    return jsonify({'file_path': file_path})

# Routes Q&A
@app.route('/api/questions', methods=['GET'])
def get_questions():
    questions = Question.query.filter_by(is_approved=True).order_by(Question.created_at.desc()).all()
    return jsonify([{
        'id': q.id,
        'title': q.title,
        'content': q.content,
        'created_at': q.created_at.isoformat()
    } for q in questions])

@app.route('/api/questions', methods=['POST'])
@jwt_required()
def create_question():
    data = request.get_json()
    question = Question(
        title=data['title'],
        content=data['content'],
        author_id=get_jwt_identity()
    )
    
    db.session.add(question)
    db.session.commit()
    
    return jsonify({'message': 'Question soumise pour modération'}), 201

# Routes pour le contenu thématique
@app.route('/api/thematic/categories', methods=['GET'])
def get_thematic_categories():
    categories = ThematicCategory.query.filter_by(is_active=True).order_by(ThematicCategory.order_index).all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'slug': c.slug,
        'description': c.description,
        'icon': c.icon
    } for c in categories])

@app.route('/api/thematic/content', methods=['GET'])
def get_thematic_content():
    category_slug = request.args.get('category')
    content_type = request.args.get('type')
    featured_only = request.args.get('featured') == 'true'
    
    query = ThematicContent.query.filter_by(is_published=True)
    
    if category_slug:
        category = ThematicCategory.query.filter_by(slug=category_slug).first()
        if category:
            query = query.filter_by(category_id=category.id)
    
    if content_type:
        query = query.filter_by(content_type=content_type)
    
    if featured_only:
        query = query.filter_by(is_featured=True)
    
    contents = query.order_by(ThematicContent.publication_date.desc()).limit(20).all()
    
    return jsonify([{
        'id': c.id,
        'title': c.title,
        'slug': c.slug,
        'excerpt': c.excerpt,
        'content_type': c.content_type,
        'format_type': c.format_type,
        'featured_image': c.featured_image,
        'reading_time': c.reading_time,
        'views': c.views,
        'likes': c.likes,
        'is_featured': c.is_featured,
        'publication_date': c.publication_date.isoformat() if c.publication_date else None,
        'tags': c.tags
    } for c in contents])

@app.route('/api/thematic/content/<slug>', methods=['GET'])
def get_thematic_content_detail(slug):
    content = ThematicContent.query.filter_by(slug=slug, is_published=True).first_or_404()
    content.views += 1
    db.session.commit()
    
    # Récupérer les références bibliques associées
    biblical_refs = BiblicalReference.query.filter_by(thematic_content_id=content.id).all()
    
    return jsonify({
        'id': content.id,
        'title': content.title,
        'content': content.content,
        'excerpt': content.excerpt,
        'content_type': content.content_type,
        'format_type': content.format_type,
        'featured_image': content.featured_image,
        'reading_time': content.reading_time,
        'views': content.views,
        'likes': content.likes,
        'publication_date': content.publication_date.isoformat() if content.publication_date else None,
        'tags': content.tags,
        'biblical_references': [{
            'book': ref.book,
            'chapter': ref.chapter,
            'verse_start': ref.verse_start,
            'verse_end': ref.verse_end,
            'text': ref.text,
            'version': ref.version
        } for ref in biblical_refs]
    })

@app.route('/api/newsletter/subscribe', methods=['POST'])
def subscribe_newsletter():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'message': 'Email requis'}), 400
    
    existing = Newsletter.query.filter_by(email=email).first()
    if existing:
        if existing.is_active:
            return jsonify({'message': 'Déjà inscrit à la newsletter'}), 400
        else:
            existing.is_active = True
            db.session.commit()
            return jsonify({'message': 'Réinscription réussie'})
    
    newsletter = Newsletter(email=email)
    db.session.add(newsletter)
    db.session.commit()
    
    return jsonify({'message': 'Inscription réussie'}), 201

# Routes admin
@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403
    
    stats = {
        'total_users': User.query.count(),
        'total_contents': Content.query.count(),
        'total_thematic_contents': ThematicContent.query.count(),
        'total_questions': Question.query.count(),
        'pending_questions': Question.query.filter_by(is_approved=False).count(),
        'newsletter_subscribers': Newsletter.query.filter_by(is_active=True).count()
    }
    
    return jsonify(stats)

@app.route('/api/admin/thematic/content', methods=['POST'])
@jwt_required()
def create_thematic_content():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403
    
    data = request.get_json()
    
    # Générer un slug unique
    import re
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', data['title'].lower())
    slug = re.sub(r'\s+', '-', slug)
    
    content = ThematicContent(
        title=data['title'],
        slug=slug,
        content=data['content'],
        excerpt=data.get('excerpt'),
        category_id=data['category_id'],
        content_type=data['content_type'],
        format_type=data.get('format_type'),
        author_id=user_id,
        reading_time=data.get('reading_time'),
        is_featured=data.get('is_featured', False),
        is_published=data.get('is_published', False),
        meta_description=data.get('meta_description'),
        tags=data.get('tags')
    )
    
    if data.get('publication_date'):
        content.publication_date = datetime.fromisoformat(data['publication_date'])
    
    db.session.add(content)
    db.session.commit()
    
    return jsonify({'message': 'Contenu créé avec succès', 'id': content.id}), 201

# Route pour sauvegarder les modifications de page
@app.route('/api/admin/save-page-edits', methods=['POST'])
def save_page_edits():
    try:
        data = request.get_json()
        page = data.get('page')
        modifications = data.get('modifications')
        
        print(f"Sauvegarde page: {page}")
        print(f"Modifications: {modifications}")
        
        return jsonify({'success': True, 'message': 'Modifications sauvegardées'})
    except Exception as e:
        print(f"Erreur sauvegarde: {e}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/save-page-change', methods=['POST'])
def save_page_change():
    try:
        data = request.get_json()
        page = data.get('page', '/')
        selector = data.get('selector')
        content_type = data.get('type')
        value = data.get('value')
        
        # Sauvegarder dans un fichier JSON simple
        import json
        import os
        
        changes_file = 'page_changes.json'
        changes = {}
        
        if os.path.exists(changes_file):
            with open(changes_file, 'r', encoding='utf-8') as f:
                changes = json.load(f)
        
        if page not in changes:
            changes[page] = {}
        
        changes[page][selector] = {
            'type': content_type,
            'value': value,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        with open(changes_file, 'w', encoding='utf-8') as f:
            json.dump(changes, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True, 'message': 'Modification sauvegardée'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/get-page-changes/<path:page_path>')
def get_page_changes(page_path):
    try:
        import json
        import os
        
        changes_file = 'page_changes.json'
        if not os.path.exists(changes_file):
            return jsonify({})
        
        with open(changes_file, 'r', encoding='utf-8') as f:
            changes = json.load(f)
        
        page_key = '/' if page_path == 'home' else f'/{page_path}'
        return jsonify(changes.get(page_key, {}))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Routes API Admin
@app.route('/api/admin/dashboard/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403
    
    stats = {
        'total_users': User.query.count(),
        'total_content': Content.query.count() + ThematicContent.query.count(),
        'total_prayers': 0,  # Simulate prayer count
        'total_questions': Question.query.count(),
        'total_donations': '0$',
        'monthly_donations': '0$'
    }
    
    return jsonify(stats)

@app.route('/api/admin/content', methods=['GET', 'POST', 'PUT', 'DELETE'])
@jwt_required()
def admin_content():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403
    
    if request.method == 'GET':
        contents = Content.query.all()
        return jsonify([{
            'id': c.id,
            'title': c.title,
            'type': c.content_type,
            'status': 'published' if c.is_published else 'draft',
            'created_at': c.created_at.isoformat()
        } for c in contents])
    
    elif request.method == 'POST':
        data = request.get_json()
        content = Content(
            title=data['title'],
            description=data.get('description', ''),
            content_type=data['type'],
            author_id=user_id,
            is_published=data.get('published', False)
        )
        db.session.add(content)
        db.session.commit()
        return jsonify({'message': 'Contenu créé', 'id': content.id}), 201
    
    elif request.method == 'DELETE':
        content_id = request.args.get('id')
        content = Content.query.get_or_404(content_id)
        db.session.delete(content)
        db.session.commit()
        return jsonify({'message': 'Contenu supprimé'})

@app.route('/api/admin/users', methods=['GET', 'POST', 'PUT', 'DELETE'])
@jwt_required()
def admin_users():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403
    
    if request.method == 'GET':
        users = User.query.all()
        return jsonify([{
            'id': u.id,
            'name': f"{u.prenom} {u.nom}",
            'email': u.email,
            'role': u.role,
            'status': 'active' if u.is_active else 'inactive',
            'created_at': u.created_at.isoformat()
        } for u in users])
    
    elif request.method == 'DELETE':
        user_id_to_delete = request.args.get('id')
        user_to_delete = User.query.get_or_404(user_id_to_delete)
        db.session.delete(user_to_delete)
        db.session.commit()
        return jsonify({'message': 'Utilisateur supprimé'})

@app.route('/api/admin/questions', methods=['GET', 'POST', 'PUT', 'DELETE'])
@jwt_required()
def admin_questions():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Accès refusé'}), 403
    
    if request.method == 'GET':
        questions = Question.query.all()
        return jsonify([{
            'id': q.id,
            'title': q.title,
            'content': q.content,
            'status': 'approved' if q.is_approved else 'pending',
            'created_at': q.created_at.isoformat()
        } for q in questions])
    
    elif request.method == 'PUT':
        question_id = request.args.get('id')
        question = Question.query.get_or_404(question_id)
        question.is_approved = True
        db.session.commit()
        return jsonify({'message': 'Question approuvée'})
    
    elif request.method == 'DELETE':
        question_id = request.args.get('id')
        question = Question.query.get_or_404(question_id)
        db.session.delete(question)
        db.session.commit()
        return jsonify({'message': 'Question supprimée'})

@app.route('/')
@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contents')
@app.route('/contenus')
def contents():
    return render_template('contents.html')

@app.route('/qa')
def qa():
    return render_template('qa.html')

@app.route('/prayers')
@app.route('/priere')
def prayers():
    return render_template('prayers.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/donation')
@app.route('/don')
def donation():
    return render_template('donation.html')

@app.route('/events')
@app.route('/evenements')
def events():
    return render_template('events.html')

@app.route('/partnerships')
@app.route('/partenariats')
def partnerships():
    return render_template('partnerships.html')

@app.route('/admin')
@app.route('/admin/')
def admin():
    return render_template('admin.html')

@app.route('/cms')
def cms():
    return render_template('cms.html')

@app.route('/guide-cms')
def guide_cms():
    return send_from_directory('../docs', 'guide-cms-interactif.html')

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/testimonies')
@app.route('/temoignages')
def testimonies():
    return render_template('testimonies.html')

# API Témoignages
@app.route('/api/testimonies', methods=['GET'])
def get_testimonies():
    testimonies = Testimony.query.filter_by(is_approved=True).order_by(Testimony.created_at.desc()).all()
    return jsonify([{
        'id': t.id,
        'author_name': t.author_name,
        'content': t.content,
        'media_type': t.media_type,
        'media_url': t.media_url,
        'created_at': t.created_at.isoformat()
    } for t in testimonies])

@app.route('/api/testimonies', methods=['POST'])
def create_testimony():
    data = request.get_json()
    if not data.get('author_name') or not data.get('media_type'):
        return jsonify({'message': 'Nom et type requis'}), 400
    testimony = Testimony(
        author_name=data['author_name'],
        content=data.get('content', ''),
        media_type=data['media_type'],
        media_url=data.get('media_url', '')
    )
    db.session.add(testimony)
    db.session.commit()
    return jsonify({'message': 'Témoignage soumis pour modération. Merci !'}), 201

# API endpoints pour le CMS
@app.route('/api/cms/contents', methods=['GET', 'POST'])
def cms_contents():
    if request.method == 'GET':
        contents = ThematicContent.query.order_by(ThematicContent.updated_at.desc()).all()
        print(f"Envoi de {len(contents)} contenus CMS")
        return jsonify([{
            'id': c.id,
            'title': c.title,
            'type': c.content_type,
            'category': c.category_id,
            'banner': c.featured_image,
            'excerpt': c.excerpt,
            'body': c.content,
            'tags': c.tags.split(',') if c.tags else [],
            'featured': c.is_featured,
            'published': c.is_published,
            'videoUrl': c.video_url or '',
            'audioUrl': c.audio_url or '',
            'created_at': c.created_at.isoformat(),
            'updated_at': c.updated_at.isoformat()
        } for c in contents])
    
    elif request.method == 'POST':
        data = request.get_json()
        
        # Générer un slug unique
        import re
        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', data['title'].lower())
        slug = re.sub(r'\s+', '-', slug)
        
        # Trouver la catégorie par nom
        category_map = {
            'dieu': 1, 'bible': 2, 'jesus-christ': 3, 'saint-esprit': 4,
            'salut': 5, 'eglise': 6, 'etre-humain': 7, 'le-mal': 8,
            'monde-invisible': 9, 'la-fin': 10, 'ethique': 11
        }
        
        content = ThematicContent(
            title=data['title'],
            slug=slug,
            content=data['body'],
            excerpt=data.get('excerpt', ''),
            category_id=category_map.get(data['category'], 1),
            content_type=data['type'],
            author_id=1,  # Admin par défaut
            featured_image=handle_image_field(data.get('banner', '')),
            is_featured=data.get('featured', False),
            is_published=data.get('published', False),
            tags=','.join(data.get('tags', [])),
            video_url=data.get('videoUrl', ''),
            audio_url=data.get('audioUrl', ''),
            publication_date=datetime.utcnow() if data.get('published') else None
        )
        
        db.session.add(content)
        db.session.commit()
        print('Nouveau contenu cree:', content.title)
        
        return jsonify({'success': True, 'id': content.id}), 201

@app.route('/api/cms/contents/<int:content_id>', methods=['PUT', 'DELETE'])
def cms_content_detail(content_id):
    content = ThematicContent.query.get_or_404(content_id)
    
    if request.method == 'PUT':
        data = request.get_json()
        
        content.title = data['title']
        content.content = data['body']
        content.excerpt = data.get('excerpt', '')
        content.content_type = data['type']
        content.featured_image = handle_image_field(data.get('banner', ''))
        content.is_featured = data.get('featured', False)
        content.is_published = data.get('published', False)
        content.tags = ','.join(data.get('tags', []))
        content.video_url = data.get('videoUrl', '')
        content.audio_url = data.get('audioUrl', '')
        content.updated_at = datetime.utcnow()
        
        if data.get('published') and not content.publication_date:
            content.publication_date = datetime.utcnow()
        
        db.session.commit()
        return jsonify({'success': True})
    
    elif request.method == 'DELETE':
        db.session.delete(content)
        db.session.commit()
        return jsonify({'success': True})

@app.route('/api/cms/users', methods=['GET', 'POST'])
def cms_users():
    if request.method == 'GET':
        users = User.query.all()
        return jsonify([{
            'id': u.id,
            'name': f"{u.prenom} {u.nom}",
            'email': u.email,
            'role': u.role,
            'created_at': u.created_at.isoformat()
        } for u in users])
    
    elif request.method == 'POST':
        data = request.get_json()
        
        user = User(
            nom=data['name'].split()[-1],
            prenom=' '.join(data['name'].split()[:-1]),
            sexe='M',
            telephone='0000000000',
            email=data['email'],
            date_naissance=datetime(1990, 1, 1).date(),
            accepte_jesus='oui',
            baptise='oui',
            password_hash=generate_password_hash('password123'),
            role=data['role']
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'success': True, 'id': user.id}), 201



@app.route('/api/cms/testimonies', methods=['GET'])
def cms_testimonies_list():
    testimonies = Testimony.query.order_by(Testimony.created_at.desc()).all()
    return jsonify([{
        'id': t.id,
        'author_name': t.author_name,
        'content': t.content,
        'media_type': t.media_type,
        'media_url': t.media_url,
        'is_approved': t.is_approved,
        'created_at': t.created_at.isoformat()
    } for t in testimonies])

@app.route('/api/cms/testimonies/<int:tid>', methods=['PUT', 'DELETE'])
def cms_testimony_action(tid):
    t = Testimony.query.get_or_404(tid)
    if request.method == 'PUT':
        data = request.get_json()
        t.is_approved = data.get('is_approved', t.is_approved)
        t.content = data.get('content', t.content)
        t.author_name = data.get('author_name', t.author_name)
        db.session.commit()
        return jsonify({'success': True})
    elif request.method == 'DELETE':
        db.session.delete(t)
        db.session.commit()
        return jsonify({'success': True})

@app.route('/api/cms/prayers', methods=['GET', 'POST'])
def cms_prayers():
    # Simulation pour les prières (à implémenter avec un vrai modèle)
    if request.method == 'GET':
        return jsonify([])
    elif request.method == 'POST':
        return jsonify({'success': True, 'id': 1}), 201

@app.route('/api/cms/questions', methods=['GET', 'POST'])
def cms_questions():
    if request.method == 'GET':
        questions = Question.query.all()
        return jsonify([{
            'id': q.id,
            'title': q.title,
            'content': q.content,
            'created_at': q.created_at.isoformat()
        } for q in questions])
    elif request.method == 'POST':
        data = request.get_json()
        question = Question(
            title=data['title'],
            content=data['answer'],
            author_id=1,
            is_approved=True
        )
        db.session.add(question)
        db.session.commit()
        return jsonify({'success': True, 'id': question.id}), 201

@app.route('/api/cms/events', methods=['GET', 'POST'])
def cms_events():
    # Simulation pour les événements (à implémenter avec un vrai modèle)
    if request.method == 'GET':
        return jsonify([])
    elif request.method == 'POST':
        return jsonify({'success': True, 'id': 1}), 201

@app.route('/api/cms/partnerships', methods=['GET', 'POST'])
def cms_partnerships():
    # Simulation pour les partenariats (à implémenter avec un vrai modèle)
    if request.method == 'GET':
        return jsonify([])
    elif request.method == 'POST':
        return jsonify({'success': True, 'id': 1}), 201

@app.route('/api/cms/donations', methods=['GET', 'POST'])
def cms_donations():
    # Simulation pour les dons (à implémenter avec un vrai modèle)
    if request.method == 'GET':
        return jsonify([])
    elif request.method == 'POST':
        return jsonify({'success': True, 'id': 1}), 201

def create_admin_user():
    try:
        if not User.query.filter_by(email='admin@croireetpenser.ca').first():
            from datetime import date
            admin = User(
                nom='Admin',
                prenom='Système',
                sexe='M',
                telephone='0000000000',
                email='admin@croireetpenser.ca',
                date_naissance=date(1990, 1, 1),
                accepte_jesus='oui',
                baptise='oui',
                annee_bapteme=2000,
                password_hash=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print("Utilisateur admin créé avec succès")
        else:
            print("Utilisateur admin déjà existant")
    except Exception as e:
        print(f"Erreur lors de la création de l'admin: {e}")
        db.session.rollback()

def init_thematic_categories():
    """Initialise les catégories thématiques selon le plan de contenu"""
    categories = [
        {'name': 'Dieu', 'slug': 'dieu', 'description': 'Questions sur l\'existence et la nature de Dieu', 'icon': 'fas fa-infinity', 'order': 1},
        {'name': 'Bible', 'slug': 'bible', 'description': 'Études et questions bibliques', 'icon': 'fas fa-book', 'order': 2},
        {'name': 'Jésus-Christ', 'slug': 'jesus-christ', 'description': 'La personne et l\'œuvre de Jésus', 'icon': 'fas fa-cross', 'order': 3},
        {'name': 'Saint-Esprit', 'slug': 'saint-esprit', 'description': 'Le Saint-Esprit et ses dons', 'icon': 'fas fa-dove', 'order': 4},
        {'name': 'Salut', 'slug': 'salut', 'description': 'Questions sur le salut et la foi', 'icon': 'fas fa-heart', 'order': 5},
        {'name': 'Église', 'slug': 'eglise', 'description': 'L\'Église et la vie communautaire', 'icon': 'fas fa-church', 'order': 6},
        {'name': 'Être humain', 'slug': 'etre-humain', 'description': 'Nature humaine et questions anthropologiques', 'icon': 'fas fa-user', 'order': 7},
        {'name': 'Le mal', 'slug': 'le-mal', 'description': 'Questions sur l\'origine et le sens du mal', 'icon': 'fas fa-shield-alt', 'order': 8},
        {'name': 'Monde invisible', 'slug': 'monde-invisible', 'description': 'Anges, esprits et réalités spirituelles', 'icon': 'fas fa-eye', 'order': 9},
        {'name': 'La fin', 'slug': 'la-fin', 'description': 'Eschatologie et vie éternelle', 'icon': 'fas fa-hourglass-end', 'order': 10},
        {'name': 'Éthique', 'slug': 'ethique', 'description': 'Questions morales et éthiques', 'icon': 'fas fa-balance-scale', 'order': 11}
    ]
    
    try:
        for cat_data in categories:
            existing = ThematicCategory.query.filter_by(slug=cat_data['slug']).first()
            if not existing:
                category = ThematicCategory(
                    name=cat_data['name'],
                    slug=cat_data['slug'],
                    description=cat_data['description'],
                    icon=cat_data['icon'],
                    order_index=cat_data['order']
                )
                db.session.add(category)
        
        db.session.commit()
        print("Catégories thématiques initialisées")
    except Exception as e:
        print(f"Erreur lors de l'initialisation des catégories: {e}")
        db.session.rollback()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Migration: élargir les colonnes URL qui étaient limitées à 500 caractères
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
    
    # Configuration pour Railway
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)