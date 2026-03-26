/* ═══════════════════════════════════════════
   Page Editor – Croire & Penser
   Charge les modifications sauvegardées au chargement
   Mode édition avec ?edit=true
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function() {
    applyPageChanges();

    if (window.location.search.includes('edit=true')) {
        initEditMode();
    }
});

/* ── Appliquer les modifications sauvegardées ── */
function applyPageChanges() {
    var page = window.location.pathname === '/' ? 'home' : window.location.pathname.replace(/^\//, '');

    fetch('/api/get-page-changes/' + page)
        .then(function(r) { return r.json(); })
        .then(function(changes) {
            if (!changes || !Object.keys(changes).length) return;

            Object.keys(changes).forEach(function(editId) {
                var change = changes[editId];
                var el = document.querySelector('[data-edit-id="' + editId + '"]');
                if (el && change.value) {
                    el.textContent = change.value;
                }
            });
        })
        .catch(function() {});
}

/* ── Mode édition ───────────────────────────── */
function initEditMode() {
    // Marquer tous les éléments éditables
    var editables = document.querySelectorAll('h1, h2, h3, h4, h5, p, span, a, blockquote, cite, label, li');
    var idx = 0;

    editables.forEach(function(el) {
        var text = el.textContent.trim();
        if (!text || text.length < 2 || el.children.length > 2) return;
        if (el.closest('nav') || el.closest('footer') || el.closest('script') || el.closest('.modal')) return;

        if (!el.getAttribute('data-edit-id')) {
            el.setAttribute('data-edit-id', 'e_' + idx);
        }
        idx++;

        el.style.outline = '2px dashed rgba(46,115,184,0.4)';
        el.style.outlineOffset = '2px';
        el.style.cursor = 'pointer';
        el.title = 'Cliquer pour modifier';

        el.addEventListener('click', function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var current = this.textContent;
            var newText = prompt('Modifier le texte :', current);
            if (newText !== null && newText !== current) {
                this.textContent = newText;
                this.style.outline = '2px solid #10b981';
                this.style.backgroundColor = 'rgba(16,185,129,0.08)';
                saveChange(this.getAttribute('data-edit-id'), newText);
            }
        });
    });

    // Barre d'outils flottante
    var bar = document.createElement('div');
    bar.innerHTML = '<span style="margin-right:12px;">✏️ <b>Mode édition</b> — Cliquez sur un texte pour le modifier</span>' +
        '<button id="editSaveBtn" style="background:#10b981;color:#fff;border:none;padding:8px 20px;border-radius:20px;font-weight:600;cursor:pointer;margin-right:8px;">💾 Sauvegardé</button>' +
        '<button onclick="window.location.href=window.location.pathname" style="background:#6b7b8d;color:#fff;border:none;padding:8px 20px;border-radius:20px;font-weight:600;cursor:pointer;">✕ Quitter</button>';
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#fff;border-top:2px solid #2E73B8;padding:12px 24px;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;font-size:.9rem;box-shadow:0 -4px 20px rgba(0,0,0,.1);';
    document.body.appendChild(bar);
}

/* ── Sauvegarder un changement ──────────────── */
function saveChange(editId, value) {
    fetch('/api/save-page-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            page: window.location.pathname,
            selector: editId,
            type: 'text',
            value: value
        })
    }).then(function(r) { return r.json(); })
      .then(function(data) {
          if (data.success) {
              var btn = document.getElementById('editSaveBtn');
              if (btn) { btn.textContent = '✅ Sauvegardé !'; }
          }
      });
}
