/* ═══════════════════════════════════════════
   HOME PAGE – Croire & Penser  (Animated)
   Hero carousel · Scroll reveal · Filters · Card tilt
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    initHeroCarousel();
    loadRecentCMS();
    initScrollReveal();
    initContentFilters();
    initCardTilt();
});

/* ── Hero Carousel (Bootstrap) ──────────── */
function initHeroCarousel() {
    const el = document.getElementById('heroCarousel');
    if (!el || typeof bootstrap === 'undefined') return;

    // Dispose any previous instance
    const prev = bootstrap.Carousel.getInstance(el);
    if (prev) prev.dispose();

    // Create fresh instance
    const carousel = new bootstrap.Carousel(el, {
        interval: 6000,
        ride: 'carousel',
        pause: false,
        touch: true,
        wrap: true
    });

    // Force start cycling
    carousel.cycle();

    // Re-trigger text animations on each slide change
    el.addEventListener('slid.bs.carousel', () => {
        const active = el.querySelector('.carousel-item.active .hero__inner');
        if (!active) return;
        active.querySelectorAll('.hero__title, .hero__subtitle, .hero__cta').forEach(c => {
            c.style.animation = 'none';
            void c.offsetHeight;
            c.style.animation = '';
        });
    });
}

/* ── Charger contenu récent du CMS ───────── */
async function loadRecentCMS() {
    const grid = document.getElementById('recentGrid');
    if (!grid) return;

    try {
        const res = await fetch('/api/cms/contents');
        const items = await res.json();
        const published = items.filter(c => c.published).slice(0, 6);
        if (!published.length) return; // garder les cartes statiques

        const typeMap = { article: 'enseignement', video: 'enseignement', podcast: 'meditation' };
        const icons = { article: 'fa-book-open', video: 'fa-play-circle', podcast: 'fa-headphones' };
        const imgClass = ['', 'card-content__img--alt', 'card-content__img--warm'];

        grid.innerHTML = published.map((c, i) => {
            const cat = typeMap[c.type] || 'reflexion';
            const icon = icons[c.type] || 'fa-lightbulb';
            const cls = imgClass[i % 3];
            const excerpt = c.excerpt || (c.body ? c.body.substring(0, 100) + '...' : '');
            return `
            <article class="card-content visible" data-category="${cat}" style="cursor:pointer;" onclick="window.location.href='/contents'">
                <div class="card-content__img ${cls}" aria-hidden="true"><i class="fas ${icon}"></i></div>
                <div class="card-content__bar"></div>
                <div class="card-content__body">
                    <span class="card-content__cat">${c.type}</span>
                    <h3 class="card-content__title">${c.title}</h3>
                    <p class="card-content__desc">${excerpt}</p>
                    <span class="card-content__link">Lire la suite <i class="fas fa-arrow-right"></i></span>
                </div>
            </article>`;
        }).join('');

        // Re-init filters and tilt on new cards
        initContentFilters();
        initCardTilt();
    } catch (e) {
        // Garder les cartes statiques en cas d'erreur
    }
}

/* ── Scroll Reveal (staggered) ──────────── */
function initScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    els.forEach(el => io.observe(el));
}

/* ── Filtres contenu récent ─────────────── */
function initContentFilters() {
    const pills = document.querySelectorAll('.filter-pill');
    const cards = document.querySelectorAll('.card-content[data-category]');
    if (!pills.length || !cards.length) return;

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => {
                p.classList.remove('filter-pill--active');
                p.setAttribute('aria-selected', 'false');
            });
            pill.classList.add('filter-pill--active');
            pill.setAttribute('aria-selected', 'true');

            const filter = pill.dataset.filter;

            cards.forEach((card, i) => {
                const match = filter === 'all' || card.dataset.category === filter;
                card.classList.toggle('hidden', !match);

                if (match) {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.transition = 'opacity .5s ease, transform .5s cubic-bezier(.175,.885,.32,1.275)';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, i * 100);
                }
            });
        });
    });
}

/* ── Card tilt subtil au survol ─────────── */
function initCardTilt() {
    const cards = document.querySelectorAll('.card-content');
    if (!cards.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width  - 0.5;
            const y = (e.clientY - rect.top)  / rect.height - 0.5;
            card.style.transform =
                `translateY(-10px) scale(1.015) perspective(600px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform .5s cubic-bezier(.175,.885,.32,1.275), box-shadow .45s ease';
            card.style.transform = 'translateY(0) scale(1) perspective(600px) rotateY(0) rotateX(0)';
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform .15s ease-out, box-shadow .45s ease';
        });
    });
}
