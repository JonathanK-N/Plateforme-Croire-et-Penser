/* ═══════════════════════════════════════════
   CONTENUS – Croire & Penser
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function() {
    loadAllContents();
    initModal();

    var type = new URLSearchParams(window.location.search).get('type');
    if (type) setTimeout(function() {
        var el = document.getElementById(type);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
});

/* ── Charger les contenus ───────────────── */
async function loadAllContents() {
    var items = [];
    try {
        var res = await fetch('/api/cms/contents');
        items = await res.json();
    } catch (e) { console.error(e); }

    var published = items.filter(function(c) { return c.published; });

    var grids = {
        article:  document.getElementById('articles-grid'),
        video:    document.getElementById('videos-grid'),
        podcast:  document.getElementById('podcasts-grid')
    };

    Object.values(grids).forEach(function(g) { if (g) g.innerHTML = ''; });

    if (!published.length) {
        Object.values(grids).forEach(function(g) {
            if (g) g.innerHTML = '<div class="col-12 text-center py-4 text-muted">Aucun contenu publie pour le moment.</div>';
        });
        return;
    }

    // Stocker les contenus globalement pour y acceder au clic
    window._cmsContents = {};
    published.forEach(function(c) {
        window._cmsContents[c.id] = c;
        var grid = grids[c.type];
        if (!grid) return;
        grid.insertAdjacentHTML('beforeend', buildCard(c));
    });

    Object.keys(grids).forEach(function(type) {
        var grid = grids[type];
        if (grid && !grid.children.length) {
            grid.innerHTML = '<div class="col-12 text-center py-4 text-muted">Aucun contenu dans cette categorie.</div>';
        }
    });
}

/* ── Construire une carte ───────────────── */
function buildCard(c) {
    var icons = { article: 'fa-newspaper', video: 'fa-play-circle', podcast: 'fa-microphone' };
    var icon = icons[c.type] || 'fa-file-alt';
    var excerpt = c.excerpt || (c.body ? c.body.substring(0, 120) + '...' : '');
    var tags = (c.tags && c.tags.length) ? c.tags.slice(0, 2).map(function(t) { return '<span class="badge-custom">' + t + '</span>'; }).join(' ') : '';
    var col = c.type === 'video' ? 'col-lg-6' : 'col-lg-4 col-md-6';

    var visual = '';
    if (c.banner) {
        var overlay = (c.type === 'video' || c.type === 'podcast')
            ? '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.2);border-radius:12px 12px 0 0;"><i class="fas fa-play-circle" style="font-size:3rem;color:#fff;opacity:.85;"></i></div>'
            : '';
        visual = '<div style="position:relative;"><img src="' + c.banner + '" style="width:100%;height:180px;object-fit:cover;border-radius:12px 12px 0 0;display:block;">' + overlay + '</div>';
    } else if (c.type === 'video') {
        visual = '<div class="position-relative mb-3 video-placeholder"><div class="ratio ratio-16x9 bg-light rounded"><div class="d-flex align-items-center justify-content-center"><i class="fas fa-play-circle fa-3x text-primary"></i></div></div></div>';
    } else {
        visual = '<div class="content-icon"><i class="fas ' + icon + '"></i></div>';
    }

    return '<div class="' + col + '">' +
        '<div class="content-card h-100 clickable-card" onclick="openContentById(' + c.id + ')">' +
            visual +
            '<h3 class="h5 fw-semibold mb-2">' + c.title + '</h3>' +
            '<p class="mb-3 text-muted" style="font-size:.9rem;">' + excerpt + '</p>' +
            '<div class="d-flex justify-content-between align-items-center mt-auto">' +
                tags +
                '<small class="text-muted">' + new Date(c.created_at).toLocaleDateString('fr-CA') + '</small>' +
            '</div>' +
        '</div>' +
    '</div>';
}

/* ── Ouvrir par ID ──────────────────────── */
function openContentById(id) {
    var c = window._cmsContents && window._cmsContents[id];
    if (c) viewContent(c);
}

/* ── Ouvrir la modale de lecture ─────────── */
function viewContent(c) {
    var body = document.getElementById('cvBody');
    var modal = document.getElementById('contentViewModal');

    var mediaBlock = '';

    if (c.type === 'video' && c.videoUrl) {
        var embed = c.videoUrl.replace('watch?v=', 'embed/').split('&')[0];
        if (c.banner) {
            // Banniere cliquable → remplace par iframe au clic
            mediaBlock =
                '<div id="cvVideoThumb" style="position:relative;cursor:pointer;margin-bottom:1.5rem;border-radius:12px;overflow:hidden;" onclick="this.innerHTML=\'<div class=\\\'ratio ratio-16x9\\\'><iframe src=\\\'' + embed + '?autoplay=1\\\' allowfullscreen allow=\\\'autoplay\\\' style=\\\'border-radius:12px;\\\'></iframe></div>\'">' +
                    '<img src="' + c.banner + '" style="width:100%;max-height:400px;object-fit:cover;display:block;">' +
                    '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3);">' +
                        '<i class="fas fa-play-circle" style="font-size:4.5rem;color:#fff;opacity:.9;filter:drop-shadow(0 2px 8px rgba(0,0,0,.3));"></i>' +
                    '</div>' +
                '</div>';
        } else {
            mediaBlock = '<div class="ratio ratio-16x9 mb-4"><iframe src="' + embed + '" allowfullscreen style="border-radius:12px;"></iframe></div>';
        }
    } else if (c.type === 'podcast') {
        if (c.banner) {
            mediaBlock = '<img src="' + c.banner + '" class="cv-banner">';
        }
        if (c.audioUrl) {
            mediaBlock += '<div class="mb-4"><audio controls src="' + c.audioUrl + '" style="width:100%;"></audio></div>';
        }
    } else if (c.banner) {
        mediaBlock = '<img src="' + c.banner + '" class="cv-banner">';
    }

    var tagsHtml = (c.tags && c.tags.length) ? '<div class="cv-tags mb-3">' + c.tags.map(function(t) { return '<span class="badge-custom">' + t + '</span>'; }).join(' ') + '</div>' : '';
    var dateStr = new Date(c.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

    body.innerHTML =
        '<div class="cv-header">' +
            '<span class="cv-type">' + c.type + '</span>' +
            '<h2 class="cv-title">' + c.title + '</h2>' +
            (c.excerpt ? '<p class="cv-excerpt">' + c.excerpt + '</p>' : '') +
            tagsHtml +
            '<small class="text-muted">Publie le ' + dateStr + '</small>' +
        '</div>' +
        mediaBlock +
        '<div class="cv-body">' + (c.body || '') + '</div>' +
        '<hr>' +
        '<div class="cv-question">' +
            '<h4><i class="fas fa-question-circle me-2"></i>Une question sur ce contenu ?</h4>' +
            '<form onsubmit="submitQuestion(event, \'' + c.title.replace(/'/g, "\\'") + '\')">' +
                '<textarea class="form-control mb-2" rows="3" placeholder="Posez votre question ici..." required></textarea>' +
                '<button type="submit" class="btn btn-primary rounded-pill px-4"><i class="fas fa-paper-plane me-2"></i>Envoyer</button>' +
            '</form>' +
        '</div>';

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/* ── Soumettre une question ─────────────── */
function submitQuestion(e, contentTitle) {
    e.preventDefault();
    var textarea = e.target.querySelector('textarea');
    var text = textarea.value.trim();
    if (!text) return;

    fetch('/api/cms/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Question sur : ' + contentTitle, answer: text })
    }).then(function() {
        textarea.value = '';
        var msg = document.createElement('p');
        msg.className = 'text-success fw-semibold mt-2';
        msg.textContent = 'Question envoyee ! Merci.';
        e.target.appendChild(msg);
        setTimeout(function() { msg.remove(); }, 3000);
    });
}

/* ── Modale : fermeture ─────────────────── */
function initModal() {
    var modal = document.getElementById('contentViewModal');
    if (!modal) return;

    modal.querySelector('.cv-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.cv-close').addEventListener('click', closeModal);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

function closeModal() {
    var modal = document.getElementById('contentViewModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}
