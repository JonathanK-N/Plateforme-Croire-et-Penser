// Configuration globale
const API_BASE = window.location.origin + '/api';
let currentUser = null;

const contentDetailData = {
    article: [
        {
            badge: 'Article',
            title: 'Foi et raison : regards croisés',
            meta: 'Lecture 7 min',
            description: 'Un parcours biblique et philosophique pour articuler intelligence et foi vivante.',
        },
        {
            badge: 'Article',
            title: 'Pratiquer la prière quotidienne',
            meta: 'Lecture 5 min',
            description: 'Des pistes concrètes pour instaurer un rythme de prière personnel et communautaire.',
        },
        {
            badge: 'Article',
            title: 'Comprendre les paraboles',
            meta: 'Lecture 9 min',
            description: 'Contextes culturels et clés d’interprétation pour lire les paraboles aujourd’hui.',
        },
    ],
    video: [
        {
            badge: 'Vidéo',
            title: 'Webinaire – Science et foi dialoguent',
            meta: '35 min',
            description: 'Un échange avec un astrophysicien chrétien autour des grandes questions cosmiques.',
        },
        {
            badge: 'Vidéo',
            title: 'Témoignage – Croire au cœur de la crise',
            meta: '18 min',
            description: 'Une histoire de résilience spirituelle et de solidarité communautaire.',
        },
    ],
    podcast: [
        {
            badge: 'Podcast',
            title: 'Foi & Raison – Saison 2',
            meta: 'Épisode 12 • 28 min',
            description: 'Conversation avec une théologienne sur la justice sociale et l’Évangile.',
        },
        {
            badge: 'Podcast',
            title: 'Méditations du matin',
            meta: 'Série quotidienne',
            description: 'Méditations guidées et prières pour commencer la journée centré sur Christ.',
        },
    ],
    study: [
        {
            badge: 'Guide',
            title: 'Parcours Évangile de Jean',
            meta: '8 rencontres',
            description: 'Questions de discussion, cartes contextuelles et prières pour chaque chapitre clé.',
        },
        {
            badge: 'Guide',
            title: 'Atelier sur les Psaumes',
            meta: '4 ateliers',
            description: 'Un cheminement poétique et théologique pour chanter la fidélité de Dieu.',
        },
    ],
    default: [
        {
            badge: 'Ressource',
            title: 'Compilation multimédia',
            meta: 'Sélection exclusive',
            description: 'Articles, podcasts et vidéos pour approfondir le thème choisi.',
        },
    ],
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadRecentContents();
    setupEventListeners();
});

// Gestion de l'authentification
function checkAuthStatus() {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
        currentUser = JSON.parse(userData);
        updateNavigation(true);
    } else {
        updateNavigation(false);
    }
}

function updateNavigation(isLoggedIn) {
    const authNav = document.getElementById('authNav');
    const userNav = document.getElementById('userNav');
    const askQuestionBtn = document.getElementById('askQuestionBtn');
    const adminLink = document.getElementById('adminLink');
    
    if (isLoggedIn) {
        authNav.classList.add('d-none');
        userNav.classList.remove('d-none');
        askQuestionBtn.style.display = 'block';
        document.getElementById('username').textContent = currentUser.username;
        
        if (currentUser.role === 'admin') {
            adminLink.style.display = 'block';
        }
    } else {
        authNav.classList.remove('d-none');
        userNav.classList.add('d-none');
        askQuestionBtn.style.display = 'none';
    }
}

// Navigation entre les pages
function showHome() {
    hideAllPages();
    document.getElementById('homePage').classList.remove('d-none');
    loadRecentContents();
    refreshPageAnimations();
}

function showContents() {
    hideAllPages();
    document.getElementById('contentsPage').classList.remove('d-none');
    refreshPageAnimations();
}

// Fonction pour charger les contenus (placeholder)
async function loadContents(filter = '') {
    // Cette fonction peut être étendue pour charger du contenu dynamique
    console.log('Chargement des contenus avec filtre:', filter);
}

// Fonction pour charger les questions (placeholder)
async function loadQuestions() {
    // Cette fonction peut être étendue pour charger des questions dynamiques
    console.log('Chargement des questions');
}

function showQuestions() {
    hideAllPages();
    document.getElementById('questionsPage').classList.remove('d-none');
    loadQuestions();
    refreshPageAnimations();
}

function hideAllPages() {
const pages = ['homePage', 'aboutPage', 'contentsPage', 'questionsPage', 'contentsDetailPage', 'qaDetailPage', 'thematicPage', 'donationPage', 'contactPage', 'prayersPage', 'contentDetailView'];
    pages.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.add('d-none');
        }
    });
}

function showAbout() {
    hideAllPages();
    document.getElementById('aboutPage').classList.remove('d-none');
    refreshPageAnimations();
}

function showQA() {
    console.log('showQA appelé');
    hideAllPages();
    const qaPage = document.getElementById('qaDetailPage');
    console.log('qaPage trouvé:', qaPage);
    if (qaPage) {
        qaPage.classList.remove('d-none');
        console.log('Page Q&A affichée');
        refreshPageAnimations();
    } else {
        console.error('Page qaDetailPage non trouvée');
    }
}

function showDonation() {
    hideAllPages();
    document.getElementById('donationPage').classList.remove('d-none');
    refreshPageAnimations();
}

function showContact() {
    hideAllPages();
    document.getElementById('contactPage').classList.remove('d-none');
    refreshPageAnimations();
}

function showPrayers() {
    hideAllPages();
    const prayersPage = document.getElementById('prayersPage');
    if (prayersPage) {
        prayersPage.classList.remove('d-none');
        refreshPageAnimations();
    }
}

// Nouvelles fonctions pour les pages détaillées
function showContentsDetail() {
    hideAllPages();
    document.getElementById('contentsDetailPage').classList.remove('d-none');
    refreshPageAnimations();
}

function refreshPageAnimations() {
    if (typeof animateOnScroll === 'function') {
        requestAnimationFrame(() => animateOnScroll());
    }
}

function showQADetail() {
    hideAllPages();
    document.getElementById('qaDetailPage').classList.remove('d-none');
    refreshPageAnimations();
}

function openContentDetail(type, title, subtitle) {
    hideAllPages();
    const detailPage = document.getElementById('contentDetailView');
    if (!detailPage) return;

    const safeSubtitle = subtitle || 'Découvrez nos ressources en profondeur.';
    document.getElementById('contentDetailTitle').textContent = title;
    document.getElementById('contentDetailSubtitle').textContent = safeSubtitle;

    const loadingSection = detailPage.querySelector('.content-detail-loading');
    const bodySection = document.getElementById('contentDetailBody');
    const listWrapper = document.getElementById('contentDetailList');

    if (loadingSection) loadingSection.classList.remove('d-none');
    if (bodySection) bodySection.classList.add('d-none');

    const entries = contentDetailData[type] || contentDetailData.default;
    if (listWrapper) {
        listWrapper.innerHTML = entries.map(buildContentDetailCard).join('');
    }

    detailPage.classList.remove('d-none');
    refreshPageAnimations();

    setTimeout(() => {
        if (loadingSection) loadingSection.classList.add('d-none');
        if (bodySection) {
            bodySection.classList.remove('d-none');
            refreshPageAnimations();
        }
    }, 1500);
}

function buildContentDetailCard(item) {
    const badge = item.badge || 'Ressource';
    const title = item.title || 'Contenu disponible prochainement';
    const meta = item.meta || '';
    const description = item.description || '';

    return `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 animate-on-scroll">
                <div class="card-body d-flex flex-column">
                    <span class="badge rounded-pill text-bg-light text-primary mb-3">${badge}</span>
                    <h5 class="card-title">${title}</h5>
                    ${meta ? `<p class="text-muted small mb-3">${meta}</p>` : ''}
                    <p class="card-text flex-grow-1">${description}</p>
                    <button class="btn btn-outline-primary mt-3 align-self-start">
                        <i class="fas fa-arrow-right me-2"></i>Consulter
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Chargement des contenus récents pour la grille
async function loadRecentContents() {
    try {
        const response = await fetch(`${API_BASE}/contents`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contents = await response.json();
        
        const recentGrid = document.getElementById('recentContentGrid');
        if (!recentGrid) return;
        
        recentGrid.innerHTML = '';
        
        contents.slice(0, 6).forEach((content, index) => {
            recentGrid.innerHTML += `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="content-card fade-in-up" onclick="openContent(${content.id})" style="animation-delay: ${index * 0.1}s">
                        <div class="content-thumbnail position-relative">
                            ${getContentIcon(content.content_type)}
                            <span class="content-type-badge">
                                ${getContentTypeLabel(content.content_type)}
                            </span>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title text-primary">${content.title}</h5>
                            <p class="card-text text-muted">
                                ${content.description ? 
                                    (content.description.length > 80 ? 
                                        content.description.substring(0, 80) + '...' : 
                                        content.description) : 
                                    'Découvrez ce contenu spirituel enrichissant'}
                            </p>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">
                                    <i class="fas fa-eye me-1"></i>${content.views} vues
                                </small>
                                <small class="text-muted">
                                    ${formatDate(content.created_at)}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Si aucun contenu, afficher un message de préparation
        if (contents.length === 0) {
            recentGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-cross text-primary" style="font-size: 4rem; margin-bottom: 1rem;"></i>
                    <h4 class="text-primary">Contenus en préparation</h4>
                    <p class="text-muted">Notre équipe prépare des contenus spirituels enrichissants pour nourrir votre foi. Revenez bientôt !</p>
                    <div class="mt-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Chargement...</span>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des contenus:', error);
        const recentGrid = document.getElementById('recentContentGrid');
        if (recentGrid) {
            recentGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                    <h5 class="mt-3">Erreur de chargement</h5>
                    <p class="text-muted">Impossible de charger les contenus pour le moment.</p>
                </div>
            `;
        }
    }
}

// Utilitaires pour les contenus
function getContentIcon(type) {
    const icons = {
        video: '<i class="fas fa-video"></i>',
        podcast: '<i class="fas fa-podcast"></i>',
        article: '<i class="fas fa-book-open"></i>',
        prayer: '<i class="fas fa-praying-hands"></i>'
    };
    return icons[type] || '<i class="fas fa-file-alt"></i>';
}

function getContentTypeLabel(type) {
    const labels = {
        video: 'Enseignement',
        podcast: 'Méditation',
        article: 'Réflexion',
        prayer: 'Prière'
    };
    return labels[type] || 'Contenu';
}

function getDefaultThumbnail(type) {
    return `https://via.placeholder.com/300x200/3498db/ffffff?text=${getContentTypeLabel(type)}`;
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Filtre de contenu
    const contentFilter = document.getElementById('contentFilter');
    if (contentFilter) {
        contentFilter.addEventListener('change', function() {
            loadContents(this.value);
        });
    }
    
    // Formulaire de question
    const questionForm = document.getElementById('questionForm');
    if (questionForm) {
        questionForm.addEventListener('submit', handleQuestionSubmit);
    }
    
    // Formulaire d'authentification (ancien - à supprimer)
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitBtn = document.getElementById('authSubmit');
            if (submitBtn && submitBtn.textContent.includes('connecter')) {
                handleLogin(e);
            } else {
                handleRegister(e);
            }
        });
    }
    
    // Nouveau formulaire d'inscription
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleNewRegister);
    }
    
    // Formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleNewLogin);
    }
}

// Gestion des questions
async function handleQuestionSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('questionTitle').value;
    const content = document.getElementById('questionContent').value;

    try {
        const response = await fetch(`${API_BASE}/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content })
        });
        
        if (response.ok) {
            showAlert('Question soumise avec succès! Elle sera visible après modération.', 'success');
            document.getElementById('questionForm').reset();
            bootstrap.Modal.getInstance(document.getElementById('questionModal')).hide();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Erreur lors de la soumission', 'danger');
        }
    } catch (error) {
        showAlert('Erreur de connexion', 'danger');
    }
}

function showQuestionForm() {
    const modal = new bootstrap.Modal(document.getElementById('questionModal'));
    modal.show();
}

// Système d'alertes
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Déconnexion
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    currentUser = null;
    updateNavigation(false);
    showHome();
    showAlert('Déconnexion réussie', 'success');
}

// Fonctions d'authentification globales
function setupAuthModal(type, title, submitText) {
    console.log('setupAuthModal appelé avec type:', type);
    
    const modal = document.getElementById('authModal');
    const modalTitle = document.getElementById('authModalTitle');
    const authFields = document.getElementById('authFields');
    const authSubmit = document.getElementById('authSubmit');
    const authForm = document.getElementById('authForm');
    
    if (!modal || !modalTitle || !authFields || !authSubmit || !authForm) {
        console.error('Éléments manquants:', { modal, modalTitle, authFields, authSubmit, authForm });
        return;
    }
    
    modalTitle.textContent = title;
    authSubmit.textContent = submitText;
    
    // Nettoyer le formulaire
    authForm.reset();
    
    if (type === 'login') {
        authFields.innerHTML = `
            <div class="mb-3">
                <label for="username" class="form-label">Nom d'utilisateur</label>
                <input type="text" class="form-control" id="username" required>
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">Mot de passe</label>
                <input type="password" class="form-control" id="password" required>
            </div>
        `;
        
        const form = document.getElementById('authForm');
        form.removeEventListener('submit', handleLogin);
        form.removeEventListener('submit', handleRegister);
        form.addEventListener('submit', handleLogin);
    } else {
        authFields.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="nom" class="form-label">Nom</label>
                    <input type="text" class="form-control" id="nom" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="prenom" class="form-label">Prénom</label>
                    <input type="text" class="form-control" id="prenom" required>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="sexe" class="form-label">Sexe</label>
                    <select class="form-select" id="sexe" required>
                        <option value="">Sélectionner</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="telephone" class="form-label">Numéro de téléphone</label>
                    <input type="tel" class="form-control" id="telephone" required>
                </div>
            </div>
            <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" class="form-control" id="email" required>
            </div>
            <div class="mb-3">
                <label for="dateNaissance" class="form-label">Date de naissance</label>
                <input type="date" class="form-control" id="dateNaissance" required>
            </div>
            <div class="mb-3">
                <label for="accepteJesus" class="form-label">Avez-vous déjà reçu Jésus comme Seigneur et Sauveur ?</label>
                <select class="form-select" id="accepteJesus" required>
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="baptise" class="form-label">Êtes-vous déjà baptisé ?</label>
                <select class="form-select" id="baptise" required onchange="toggleBaptismYear()">
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                </select>
            </div>
            <div class="mb-3 d-none" id="anneeBaptemeDiv">
                <label for="anneeBapteme" class="form-label">Année de baptême</label>
                <input type="number" class="form-control" id="anneeBapteme" min="1900" max="2024">
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">Mot de passe</label>
                <input type="password" class="form-control" id="password" required minlength="6">
            </div>
            <div class="mb-3">
                <label for="confirmPassword" class="form-label">Confirmer le mot de passe</label>
                <input type="password" class="form-control" id="confirmPassword" required>
            </div>
        `;
        
        // Ajouter la fonction pour afficher/masquer l'année de baptême
        window.toggleBaptismYear = function() {
            const baptise = document.getElementById('baptise').value;
            const anneeBaptemeDiv = document.getElementById('anneeBaptemeDiv');
            if (baptise === 'oui') {
                anneeBaptemeDiv.classList.remove('d-none');
                document.getElementById('anneeBapteme').required = true;
            } else {
                anneeBaptemeDiv.classList.add('d-none');
                document.getElementById('anneeBapteme').required = false;
            }
        };
        
        const form = document.getElementById('authForm');
        form.removeEventListener('submit', handleLogin);
        form.removeEventListener('submit', handleRegister);
        form.addEventListener('submit', handleRegister);
    }
    
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

window.showLogin = function() {
    const modal = document.getElementById('authModal');
    const modalTitle = document.getElementById('authModalTitle');
    const authFields = document.getElementById('authFields');
    const authSubmit = document.getElementById('authSubmit');
    
    modalTitle.textContent = 'Connexion';
    authSubmit.textContent = 'Se connecter';
    
    authFields.innerHTML = `
        <div class="mb-3">
            <label class="form-label">Nom d'utilisateur</label>
            <input type="text" class="form-control" id="username" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Mot de passe</label>
            <input type="password" class="form-control" id="password" required>
        </div>
    `;
    
    new bootstrap.Modal(modal).show();
};

window.showRegister = function() {
    const modal = document.getElementById('authModal');
    const modalTitle = document.getElementById('authModalTitle');
    const modalBody = document.getElementById('authModalBody');
    
    modalTitle.textContent = 'Inscription';
    
    modalBody.innerHTML = `
        <form id="authForm">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nom</label>
                    <input type="text" class="form-control" id="nom" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Prénom</label>
                    <input type="text" class="form-control" id="prenom" required>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Sexe</label>
                    <select class="form-select" id="sexe" required>
                        <option value="">Sélectionner</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Téléphone</label>
                    <input type="tel" class="form-control" id="telephone" required>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="email" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Date de naissance</label>
                <input type="date" class="form-control" id="dateNaissance" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Avez-vous déjà reçu Jésus comme Seigneur et Sauveur ?</label>
                <select class="form-select" id="accepteJesus" required>
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Êtes-vous déjà baptisé ?</label>
                <select class="form-select" id="baptise" required>
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Mot de passe</label>
                <input type="password" class="form-control" id="password" required minlength="6">
            </div>
            <div class="mb-3">
                <label class="form-label">Confirmer le mot de passe</label>
                <input type="password" class="form-control" id="confirmPassword" required>
            </div>
            <button type="submit" class="btn btn-primary w-100">S'inscrire</button>
        </form>
    `;
    
    new bootstrap.Modal(modal).show();
};

// Gestion de la connexion
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('authSubmit');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Connexion...';
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            
            currentUser = data.user;
            updateNavigation(true);
            
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            showAlert('Connexion réussie!', 'success');
        } else {
            showAlert(data.message || 'Erreur de connexion', 'danger');
        }
    } catch (error) {
        showAlert('Erreur de connexion au serveur', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Se connecter';
    }
}

// Gestion de l'inscription
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = {
        nom: document.getElementById('nom').value,
        prenom: document.getElementById('prenom').value,
        sexe: document.getElementById('sexe').value,
        telephone: document.getElementById('telephone').value,
        email: document.getElementById('email').value,
        dateNaissance: document.getElementById('dateNaissance').value,
        accepteJesus: document.getElementById('accepteJesus').value,
        baptise: document.getElementById('baptise').value,
        anneeBapteme: document.getElementById('baptise').value === 'oui' ? document.getElementById('anneeBapteme').value : null,
        password: document.getElementById('password').value
    };
    
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = document.getElementById('authSubmit');
    
    if (formData.password !== confirmPassword) {
        showAlert('Les mots de passe ne correspondent pas', 'danger');
        return;
    }
    
    if (formData.password.length < 6) {
        showAlert('Le mot de passe doit contenir au moins 6 caractères', 'danger');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Inscription...';
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Inscription réussie! Vous pouvez maintenant vous connecter.', 'success');
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            
            setTimeout(() => {
                showLogin();
            }, 1000);
        } else {
            showAlert(data.message || 'Erreur lors de l\'inscription', 'danger');
        }
    } catch (error) {
        showAlert('Erreur de connexion au serveur', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'S\'inscrire';
    }
}

// Nouvelle fonction pour le formulaire d'inscription avec tous les champs
async function handleNewRegister(e) {
    e.preventDefault();
    
    const formData = {
        nom: document.getElementById('nom').value,
        prenom: document.getElementById('prenom').value,
        sexe: document.getElementById('sexe').value,
        telephone: document.getElementById('telephone').value,
        email: document.getElementById('registerEmail').value,
        dateNaissance: document.getElementById('dateNaissance').value,
        accepteJesus: document.getElementById('accepteJesus').value,
        baptise: document.getElementById('baptise').value,
        password: document.getElementById('registerPassword').value
    };
    
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (formData.password !== confirmPassword) {
        showAlert('Les mots de passe ne correspondent pas', 'danger');
        return;
    }
    
    if (formData.password.length < 6) {
        showAlert('Le mot de passe doit contenir au moins 6 caractères', 'danger');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Inscription...';
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Inscription réussie! Vous pouvez maintenant vous connecter.', 'success');
            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
            
            setTimeout(() => {
                new bootstrap.Modal(document.getElementById('authModal')).show();
            }, 1000);
        } else {
            showAlert(data.message || 'Erreur lors de l\'inscription', 'danger');
        }
    } catch (error) {
        showAlert('Erreur de connexion au serveur', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'S\'inscrire';
    }
}

// Nouvelle fonction pour le formulaire de connexion
async function handleNewLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Connexion...';
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            
            currentUser = data.user;
            updateNavigation(true);
            
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            showAlert('Connexion réussie!', 'success');
        } else {
            showAlert(data.message || 'Erreur de connexion', 'danger');
        }
    } catch (error) {
        showAlert('Erreur de connexion au serveur', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Se connecter';
    }
}

// Fonctions globales pour les nouvelles pages
window.showContentsDetail = showContentsDetail;
window.showQADetail = showQADetail;
window.openContentDetail = openContentDetail;
