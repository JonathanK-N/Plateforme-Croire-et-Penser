/* ═══════════════════════════════════════════
   CONTENUS – Croire & Penser
   Charge depuis l'API, injecte dans les bonnes sections,
   ouvre une modale de lecture (article/vidéo/audio)
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    loadAllContents();
    initModal();

    const type = new URLSearchParams(window.location.search).get('type');
    if (type) setTimeout(() => {
        const el = document.getElementById(type);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
});

/* ── Charger les contenus depuis l'API ──── */
async function loadAllContents() {
    let items = [];
    try {
        const res = await fetch('/api/cms/contents');
        items = await res.json();
    } catch (e) { console.error(e); }

    const published = items.filter(c => c.published);

    const grids = {
        article:  document.getElementById('articles-grid'),
        video:    document.getElementById('videos-grid'),
        podcast:  document.getElementById('podcasts-grid')
    };

    // Vider les grilles
    Object.values(grids).forEach(g => { if (g) g.innerHTML = ''; });

    if (!published.length) {
        Object.values(grids).forEach(g => {
            if (g) g.innerHTML = '<div class="col-12 text-center py-4 text-muted">Aucun contenu publié pour le moment.</div>';
        });
        return;
    }

    published.forEach(c => {
        const grid = grids[c.type];
        if (!grid) return;
        grid.insertAdjacentHTML('beforeend', buildCard(c));
    });

    // Si une section est vide, afficher un message
    Object.entries(grids).forEach(([type, grid]) => {
        if (grid && !grid.children.length) {
            grid.innerHTML = '<div class="col-12 text-center py-4 text-muted">Aucun contenu dans cette catégorie.</div>';
        }
    });
}

/* ── Construire une carte ───────────────── */
function buildCard(c) {
    const icons = { article: 'fa-newspaper', video: 'fa-play-circle', podcast: 'fa-microphone' };
    const icon = icons[c.type] || 'fa-file-alt';
    const excerpt = c.excerpt || (c.body ? c.body.substring(0, 120) + '…' : '');
    const tags = (c.tags && c.tags.length) ? c.tags.slice(0, 2).map(t => `<span class="badge-custom">${t}</span>`).join(' ') : '';
    const col = c.type === 'video' ? 'col-lg-6' : 'col-lg-4 col-md-6';

    let visual = '';
    if (c.type === 'video') {
        visual = `<div class="position-relative mb-3 video-placeholder">
            <div class="ratio ratio-16x9 bg-light rounded">
                <div class="d-flex align-items-center justify-content-center">
                    <i class="fas fa-play-circle fa-3x text-primary play-icon"></i>
                </div>
            </div></div>`;
    } else {
        visual = `<div class="content-icon"><i class="fas ${icon}"></i></div>`;
    }

    return `
    <div class="${col}">
        <div class="content-card h-100 clickable-card" onclick='viewContent(${JSON.stringify(c).replace(/'/g, "&#39;")})'>
            ${c.banner ? `<img src="${c.banner}" class="card-img-top" style="height:180px;object-fit:cover;border-radius:12px 12px 0 0;">` : visual}
            <h3 class="h5 fw-semibold mb-2">${c.title}</h3>
            <p class="mb-3 text-muted" style="font-size:.9rem;">${excerpt}</p>
            <div class="d-flex justify-content-between align-items-center mt-auto">
                ${tags}
                <small class="text-muted">${new Date(c.created_at).toLocaleDateString('fr-CA')}</small>
            </div>
        </div>
    </div>`;
}

/* ── Ouvrir la modale de lecture ─────────── */
function viewContent(c) {
    const body = document.getElementById('cvBody');
    const modal = document.getElementById('contentViewModal');

    let media = '';
    if (c.type === 'video' && c.videoUrl) {
        const embed = c.videoUrl.replace('watch?v=', 'embed/').split('&')[0];
        media = `<div class="ratio ratio-16x9 mb-4"><iframe src="${embed}" allowfullscreen style="border-radius:12px;"></iframe></div>`;
    } else if (c.type === 'podcast' && c.audioUrl) {
        media = `<div class="mb-4"><audio controls src="${c.audioUrl}" style="width:100%;"></audio></div>`;
    }

    const tagsHtml = (c.tags && c.tags.length) ? `<div class="cv-tags mb-3">${c.tags.map(t => `<span class="badge-custom">${t}</span>`).join(' ')}</div>` : '';

    body.innerHTML = `
        <div class="cv-header">
            <span class="cv-type">${c.type}</span>
            <h2 class="cv-title">${c.title}</h2>
            ${c.excerpt ? `<p class="cv-excerpt">${c.excerpt}</p>` : ''}
            ${tagsHtml}
            <small class="text-muted">Publié le ${new Date(c.created_at).toLocaleDateString('fr-CA', { day:'numeric', month:'long', year:'numeric' })}</small>
        </div>
        ${c.banner ? `<img src="${c.banner}" class="cv-banner">` : ''}
        ${media}
        <div class="cv-body">${c.body || ''}</div>
        <hr>
        <div class="cv-question">
            <h4><i class="fas fa-question-circle me-2"></i>Une question sur ce contenu ?</h4>
            <form onsubmit="submitQuestion(event, '${c.title.replace(/'/g, "\\'")}')">
                <textarea class="form-control mb-2" rows="3" placeholder="Posez votre question ici…" required></textarea>
                <button type="submit" class="btn btn-primary rounded-pill px-4"><i class="fas fa-paper-plane me-2"></i>Envoyer</button>
            </form>
        </div>`;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/* ── Soumettre une question ─────────────── */
function submitQuestion(e, contentTitle) {
    e.preventDefault();
    const textarea = e.target.querySelector('textarea');
    const text = textarea.value.trim();
    if (!text) return;

    fetch('/api/cms/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Question sur : ' + contentTitle, answer: text })
    }).then(() => {
        textarea.value = '';
        const msg = document.createElement('p');
        msg.className = 'text-success fw-semibold mt-2';
        msg.textContent = '✅ Question envoyée ! Merci.';
        e.target.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    });
}

/* ── Modale : init fermeture ────────────── */
function initModal() {
    const modal = document.getElementById('contentViewModal');
    if (!modal) return;

    modal.querySelector('.cv-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.cv-close').addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function closeModal() {
    const modal = document.getElementById('contentViewModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}
