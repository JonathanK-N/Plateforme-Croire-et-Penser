// Q&A Page JavaScript
console.log('QA JavaScript loaded');

// Charger et afficher les questions approuvées depuis l'API
async function loadApprovedQuestions() {
    const grid = document.getElementById('qaGrid');
    if (!grid) return;
    try {
        const res = await fetch('/api/questions');
        const questions = await res.json();
        if (!questions.length) return; // garder le message placeholder
        grid.innerHTML = questions.map(q => `
            <div class="col-12">
                <div class="card shadow-sm border-0 mb-3">
                    <div class="card-body p-4">
                        <h5 class="fw-bold mb-2">${q.title}</h5>
                        <p class="text-muted mb-0">${q.content}</p>
                        <div class="mt-2 text-end">
                            <small class="text-muted">${new Date(q.created_at).toLocaleDateString('fr-CA')}</small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch(e) {
        console.error('Erreur chargement questions:', e);
    }
}

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing QA page');
    loadApprovedQuestions();
    
    // Animation observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observer toutes les cartes de questions
    document.querySelectorAll('.question-card').forEach(card => {
        observer.observe(card);
    });
    
    // Filtrage par catégorie
    const filterButtons = document.querySelectorAll('.filter-btn');
    const questionCards = document.querySelectorAll('.question-card');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Retirer la classe active de tous les boutons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            
            const category = this.dataset.category;
            
            questionCards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
    
    // Animation des cartes au hover
    questionCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Fonction pour ouvrir une question (définie globalement)
window.openQuestion = function(questionId, event) {
    console.log('Opening question:', questionId);
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    showQuestionModal(questionId);
};

// Modal de question détaillée
function showQuestionModal(questionId) {
    console.log('Showing modal for:', questionId);
    
    const questions = {
        'existence-dieu': {
            title: 'Peut-on prouver l\'existence de Dieu ?',
            category: 'Théologie',
            content: `
                <p>Cette question fondamentale a occupé les plus grands penseurs de l'histoire. Bien que nous ne puissions pas "prouver" Dieu comme un théorème mathématique, il existe plusieurs arguments rationnels solides :</p>
                
                <h5>1. L'argument cosmologique</h5>
                <p>Tout ce qui commence à exister a une cause. L'univers a commencé à exister, donc l'univers a une cause.</p>
                
                <h5>2. L'argument téléologique</h5>
                <p>La complexité et l'ordre de l'univers suggèrent un dessein intelligent.</p>
                
                <h5>3. L'argument moral</h5>
                <p>L'existence de valeurs morales objectives pointe vers un fondement transcendant.</p>
                
                <p class="mt-4"><strong>Conclusion :</strong> Ces arguments ne constituent pas une "preuve" au sens scientifique, mais offrent des raisons rationnelles de croire en Dieu.</p>
            `
        },
        'foi-science': {
            title: 'Foi et science sont-elles compatibles ?',
            category: 'Science',
            content: `
                <p>Cette question révèle souvent une incompréhension des domaines respectifs de la foi et de la science.</p>
                
                <h5>Domaines complémentaires</h5>
                <p>La science répond au "comment" des phénomènes naturels, tandis que la foi aborde le "pourquoi" et le sens de l'existence.</p>
                
                <h5>Histoire harmonieuse</h5>
                <p>De nombreux pionniers de la science moderne étaient croyants : Newton, Kepler, Mendel, Pasteur...</p>
                
                <h5>Limites de la science</h5>
                <p>La science ne peut répondre aux questions de sens, de valeur, ou de but ultime de l'existence.</p>
                
                <p class="mt-4"><strong>Conclusion :</strong> Foi et science peuvent coexister harmonieusement quand chacune respecte son domaine de compétence.</p>
            `
        },
        'jesus-historique': {
            title: 'Jésus a-t-il vraiment existé ?',
            category: 'Histoire',
            content: `
                <p>La quasi-totalité des historiens, chrétiens ou non, s'accordent sur l'existence historique de Jésus de Nazareth.</p>
                
                <h5>Sources non-chrétiennes</h5>
                <p>Tacite, Flavius Josèphe, Suétone et Pline le Jeune mentionnent Jésus dans leurs écrits.</p>
                
                <h5>Critères historiques</h5>
                <p>Les critères d'authenticité historique (embarras, attestation multiple, discontinuité) confirment l'historicité de Jésus.</p>
                
                <h5>Consensus académique</h5>
                <p>Même les historiens non-croyants comme Bart Ehrman affirment l'existence historique de Jésus.</p>
                
                <p class="mt-4"><strong>Conclusion :</strong> L'existence historique de Jésus est un fait établi par la recherche historique moderne.</p>
            `
        },
        'mal-souffrance': {
            title: 'Pourquoi Dieu permet-il le mal ?',
            category: 'Éthique',
            content: `
                <p>Cette question millénaire, appelée "théodicée", trouve des éléments de réponse dans plusieurs perspectives.</p>
                
                <h5>La liberté humaine</h5>
                <p>Dieu a créé l'homme libre, capable de choisir le bien ou le mal. Cette liberté implique la possibilité du mal moral.</p>
                
                <h5>Le mal naturel</h5>
                <p>Les catastrophes naturelles peuvent servir à révéler la solidarité humaine et notre dépendance mutuelle.</p>
                
                <h5>Perspective éternelle</h5>
                <p>La souffrance temporelle prend un sens différent dans la perspective de l'éternité et de la rédemption.</p>
                
                <p class="mt-4"><strong>Conclusion :</strong> Bien que mystérieuse, la coexistence de Dieu et du mal trouve des explications rationnelles dans la liberté et l'amour divin.</p>
            `
        },
        'bible-fiable': {
            title: 'La Bible est-elle fiable historiquement ?',
            category: 'Bible',
            content: `
                <p>Les découvertes archéologiques et l'analyse textuelle confirment la remarquable préservation des textes bibliques.</p>
                
                <h5>Manuscrits anciens</h5>
                <p>Plus de 5 800 manuscrits grecs du Nouveau Testament, dont certains datent du IIe siècle.</p>
                
                <h5>Confirmations archéologiques</h5>
                <p>De nombreuses découvertes confirment les détails historiques et géographiques de la Bible.</p>
                
                <h5>Transmission fidèle</h5>
                <p>La comparaison des manuscrits montre une transmission remarquablement fidèle du texte original.</p>
                
                <p class="mt-4"><strong>Conclusion :</strong> La Bible présente une fiabilité historique exceptionnelle comparée aux autres textes antiques.</p>
            `
        },
        'autres-religions': {
            title: 'Pourquoi le christianisme et pas une autre religion ?',
            category: 'Religions',
            content: `
                <p>Chaque religion mérite le respect, mais le christianisme présente des caractéristiques uniques.</p>
                
                <h5>Historicité unique</h5>
                <p>Le christianisme est fondé sur des événements historiques vérifiables : la vie, mort et résurrection de Jésus.</p>
                
                <h5>Grâce vs mérite</h5>
                <p>Contrairement aux autres religions basées sur les œuvres, le christianisme offre le salut par grâce.</p>
                
                <h5>Amour inconditionnel</h5>
                <p>Le concept d'un Dieu qui s'abaisse pour sauver l'humanité est unique au christianisme.</p>
                
                <p class="mt-4"><strong>Conclusion :</strong> Le christianisme se distingue par son message de grâce, d'amour inconditionnel et sa base historique solide.</p>
            `
        }
    };
    
    const question = questions[questionId] || {
        title: 'Question en préparation',
        category: 'Général',
        content: '<p>Cette réponse détaillée est en cours de préparation par notre équipe d\'experts.</p>'
    };
    
    // Supprimer toute modale existante
    const existingModal = document.querySelector('.qa-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    const modal = document.createElement('div');
    modal.className = 'qa-modal';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeQuestionModal()"></div>
        <div class="modal-content animate-modal-in">
            <div class="modal-header">
                <div>
                    <span class="question-badge">${question.category}</span>
                    <h3 class="mt-2">${question.title}</h3>
                </div>
                <button onclick="closeQuestionModal()" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
                ${question.content}
                <div class="mt-4 p-3 bg-light rounded">
                    <p class="mb-2"><strong>Cette réponse vous a-t-elle aidé ?</strong></p>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-success">👍 Oui</button>
                        <button class="btn btn-sm btn-outline-danger">👎 Non</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    console.log('Modal added to DOM');
}

window.closeQuestionModal = function() {
    console.log('Closing modal');
    const modal = document.querySelector('.qa-modal');
    if (modal) {
        modal.querySelector('.modal-content').classList.add('animate-modal-out');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.body.style.overflow = 'auto';
        }, 300);
    }
};

// Modal pour poser une question
window.openAskQuestionModal = function() {
    console.log('Opening ask question modal');
    
    // Supprimer toute modale existante
    const existingModal = document.querySelector('.ask-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    const modal = document.createElement('div');
    modal.className = 'ask-modal';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeAskModal()"></div>
        <div class="modal-content animate-modal-in">
            <div class="modal-header">
                <h3>Poser une question</h3>
                <button onclick="closeAskModal()" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
                <form class="ask-form">
                    <div class="form-group mb-3">
                        <label class="form-label">Catégorie</label>
                        <select class="form-select" required>
                            <option value="">Choisir une catégorie</option>
                            <option value="dieu">Dieu</option>
                            <option value="bible">Bible</option>
                            <option value="jesus">Jésus-Christ</option>
                            <option value="foi">Foi & Raison</option>
                            <option value="science">Science</option>
                            <option value="ethique">Éthique</option>
                            <option value="autre">Autre</option>
                        </select>
                    </div>
                    <div class="form-group mb-3">
                        <label class="form-label">Votre question</label>
                        <input type="text" class="form-control" placeholder="Résumez votre question en une phrase" required>
                    </div>
                    <div class="form-group mb-3">
                        <label class="form-label">Détails (optionnel)</label>
                        <textarea class="form-control" rows="4" placeholder="Développez votre question, donnez du contexte..."></textarea>
                    </div>
                    <div class="form-group mb-4">
                        <label class="form-label">Votre email (pour recevoir la réponse)</label>
                        <input type="email" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Envoyer ma question</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Gérer la soumission
    modal.querySelector('.ask-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleQuestionSubmission();
    });
};

window.closeAskModal = function() {
    console.log('Closing ask modal');
    const modal = document.querySelector('.ask-modal');
    if (modal) {
        modal.querySelector('.modal-content').classList.add('animate-modal-out');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.body.style.overflow = 'auto';
        }, 300);
    }
};

function handleQuestionSubmission() {
    const button = document.querySelector('.ask-form button');
    const originalText = button.textContent;
    
    button.textContent = 'Envoi en cours...';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = '✓ Question envoyée !';
        button.style.background = 'linear-gradient(45deg, #059669, #10b981)';
        
        setTimeout(() => {
            closeAskModal();
        }, 1500);
    }, 2000);
}