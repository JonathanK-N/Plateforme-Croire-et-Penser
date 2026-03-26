/* ═══════════════════════════════════════════
   TÉMOIGNAGES – Croire & Penser
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    loadTestimonies();
    initTypeSelector();
    initFormSubmit();
    initFilters();
    initReveal();
});

/* ── Charger les témoignages ────────────── */
async function loadTestimonies() {
    const grid = document.getElementById('tmGrid');
    if (!grid) return;

    try {
        const res = await fetch('/api/testimonies');
        const data = await res.json();

        if (!data.length) return;

        grid.innerHTML = data.map(t => buildCard(t)).join('');

        // Observer les nouvelles cartes pour le reveal
        grid.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('visible');
        });
    } catch (e) {
        console.error('Erreur chargement témoignages:', e);
    }
}

function buildCard(t) {
    const initials = t.author_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const date = new Date(t.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
    const badgeLabel = { text: 'Texte', video: 'Vidéo', audio: 'Audio' }[t.media_type] || 'Texte';
    const badgeIcon = { text: 'fa-pen-fancy', video: 'fa-video', audio: 'fa-headphones' }[t.media_type] || 'fa-pen-fancy';

    let media = '';
    if (t.media_type === 'video' && t.media_url) {
        const embed = t.media_url.replace('watch?v=', 'embed/').split('&')[0];
        media = `<div class="tm-card__media"><iframe src="${embed}" allowfullscreen loading="lazy"></iframe></div>`;
    } else if (t.media_type === 'audio' && t.media_url) {
        media = `<div class="tm-card__media"><audio controls src="${t.media_url}"></audio></div>`;
    }

    return `
        <div class="tm-card reveal" data-type="${t.media_type}">
            <div class="tm-card__head">
                <div class="tm-card__avatar">${initials}</div>
                <div>
                    <div class="tm-card__name">${t.author_name}</div>
                    <div class="tm-card__date">${date}</div>
                </div>
                <span class="tm-card__badge"><i class="fas ${badgeIcon} me-1"></i>${badgeLabel}</span>
            </div>
            ${t.content ? `<div class="tm-card__body">${t.content}</div>` : ''}
            ${media}
        </div>`;
}

/* ── Filtres ─────────────────────────────── */
function initFilters() {
    const pills = document.querySelectorAll('.tm-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('tm-pill--active'));
            pill.classList.add('tm-pill--active');

            const f = pill.dataset.filter;
            document.querySelectorAll('.tm-card').forEach(card => {
                const show = f === 'all' || card.dataset.type === f;
                card.classList.toggle('hidden', !show);
            });
        });
    });
}

/* ── Sélecteur de type (formulaire) ─────── */
function initTypeSelector() {
    const types = document.querySelectorAll('.tm-type');
    const fieldText  = document.getElementById('tmFieldText');
    const fieldVideo = document.getElementById('tmFieldVideo');
    const fieldAudio = document.getElementById('tmFieldAudio');

    types.forEach(label => {
        label.addEventListener('click', () => {
            types.forEach(t => t.classList.remove('tm-type--active'));
            label.classList.add('tm-type--active');

            const val = label.dataset.type;
            fieldText.classList.toggle('tm-form__field--hidden', val !== 'text');
            fieldVideo.classList.toggle('tm-form__field--hidden', val !== 'video');
            fieldAudio.classList.toggle('tm-form__field--hidden', val !== 'audio');
        });
    });
}

/* ── Soumission du formulaire ───────────── */
function initFormSubmit() {
    const form = document.getElementById('tmForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('tmName').value.trim();
        const type = document.querySelector('.tm-type--active')?.dataset.type || 'text';
        const content = document.getElementById('tmContent').value.trim();
        const videoUrl = document.getElementById('tmVideoUrl').value.trim();
        const audioUrl = document.getElementById('tmAudioUrl').value.trim();

        if (!name) { toast('Veuillez entrer votre nom.', true); return; }
        if (type === 'text' && !content) { toast('Veuillez écrire votre témoignage.', true); return; }
        if (type === 'video' && !videoUrl) { toast('Veuillez coller le lien vidéo.', true); return; }
        if (type === 'audio' && !audioUrl) { toast('Veuillez coller le lien audio.', true); return; }

        const btn = form.querySelector('.tm-form__submit');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Envoi…';

        try {
            const res = await fetch('/api/testimonies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    author_name: name,
                    media_type: type,
                    content: type === 'text' ? content : '',
                    media_url: type === 'video' ? videoUrl : type === 'audio' ? audioUrl : ''
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast(data.message || 'Témoignage envoyé !');
                form.reset();
                document.querySelectorAll('.tm-type').forEach(t => t.classList.remove('tm-type--active'));
                document.querySelector('.tm-type[data-type="text"]').classList.add('tm-type--active');
                document.getElementById('tmFieldText').classList.remove('tm-form__field--hidden');
                document.getElementById('tmFieldVideo').classList.add('tm-form__field--hidden');
                document.getElementById('tmFieldAudio').classList.add('tm-form__field--hidden');
            } else {
                toast(data.message || 'Erreur lors de l\'envoi.', true);
            }
        } catch (err) {
            toast('Erreur de connexion.', true);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>Envoyer mon témoignage</span> <i class="fas fa-paper-plane"></i>';
        }
    });
}

/* ── Toast notification ─────────────────── */
function toast(msg, isError) {
    const el = document.createElement('div');
    el.className = 'tm-toast' + (isError ? ' tm-toast--error' : '');
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 400);
    }, 3500);
}

/* ── Scroll Reveal ──────────────────────── */
function initReveal() {
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            e.target.classList.add('visible');
            io.unobserve(e.target);
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}
