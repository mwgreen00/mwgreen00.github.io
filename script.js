  // Annotation toggle (optional: the topbar may be commented out)
  var annBtn = document.getElementById('annToggle');
  if (annBtn) {
    annBtn.addEventListener('click', function () {
      var on = document.body.classList.toggle('annotate');
      annBtn.textContent = 'Annotations: ' + (on ? 'On' : 'Off');
      annBtn.setAttribute('aria-pressed', String(on));
    });
  }

  var mainSections = Array.prototype.slice.call(document.querySelectorAll('details.sec'));
  var subSections = Array.prototype.slice.call(document.querySelectorAll('details.sub'));

  // nav links keyed by target id
  var navLinks = {};
  document.querySelectorAll('.anchornav a[data-spy]').forEach(function (a) {
    navLinks[a.getAttribute('data-spy')] = a;
  });
  function clearActive() { Object.keys(navLinks).forEach(function (k) { navLinks[k].classList.remove('active'); }); }
  function highlight(ids) { clearActive(); ids.forEach(function (id) { if (navLinks[id]) navLinks[id].classList.add('active'); }); }
  function sectionIdOf(sec) { var s = sec.closest('section'); return s ? s.id : null; }
  function closeOtherMain(except) { mainSections.forEach(function (s) { if (s !== except) s.open = false; }); }
  function closeOtherSub(except) { subSections.forEach(function (s) { if (s !== except) s.open = false; }); }

  // ids to highlight for an open main section, plus its open subsection if any
  function activeIdsFor(sec, subId) {
    var ids = [];
    var sid = sectionIdOf(sec);
    if (sid) ids.push(sid);
    if (!subId) { var os = sec.querySelector('details.sub[open]'); if (os) subId = os.id; }
    if (subId) ids.push(subId);
    return ids;
  }

  // Accordion for main sections
  mainSections.forEach(function (sec) {
    var summary = sec.querySelector('summary');
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      var willOpen = !sec.open;
      closeOtherMain(sec);
      sec.open = willOpen;
      if (willOpen) { highlight(activeIdsFor(sec)); } else { clearActive(); }
    });
  });

  // Accordion for subsections, updating the left menu the same way
  subSections.forEach(function (sub) {
    var summary = sub.querySelector('summary');
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      var willOpen = !sub.open;
      closeOtherSub(sub);
      sub.open = willOpen;
      var parentSec = sub.closest('details.sec');
      if (willOpen) { highlight(activeIdsFor(parentSec, sub.id)); } else { highlight(activeIdsFor(parentSec)); }
    });
  });

  // Nav clicks: open target section (closing others), open subsection (closing sibling subs), highlight, then let the hash scroll happen
  document.querySelectorAll('.anchornav a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var id = a.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      var sectionEl = target.closest('section');
      var mainSec = sectionEl ? sectionEl.querySelector('details.sec') : null;
      var isSub = target.matches && target.matches('details.sub');
      closeOtherMain(mainSec);
      if (mainSec) mainSec.open = true;
      if (isSub) { closeOtherSub(target); target.open = true; }
      if (mainSec) highlight(activeIdsFor(mainSec, isSub ? id : null));
    });
  });

  // Close all sections and subsections (optional: the topbar may be commented out)
  var allBtn = document.getElementById('allToggle');
  if (allBtn) {
    allBtn.addEventListener('click', function () { closeOtherMain(null); closeOtherSub(null); clearActive(); });
  }

/* ---------------------------------------------------------------
   Audience-driven card loader (static-first)
   The default view is baked into index.html, so the page works
   with JavaScript off or if a load fails. This loader runs only
   for a non-default ?audience=NAME, and it replaces the baseline
   only after the manifest loads successfully. On failure it leaves
   the default view in place and shows an instruction banner.
   Served over http only (fetch does not work from a file path).
--------------------------------------------------------------- */
(function () {
  var params = new URLSearchParams(window.location.search);
  var audience = params.get('audience') || 'default';
  if (audience === 'default') return; // baseline HTML already shows the default view

  var errorBox = document.getElementById('load-error');
  function showError(msg) {
    if (!errorBox) return;
    if (msg) errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }
  var timer = setTimeout(function () {
    showError('The "' + audience + '" view is taking too long to load. Showing the default. Reload the page, or remove the ?audience part from the link.');
  }, 6000);

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function buildTags(tags) {
    var wrap = el('div', 'tags');
    (tags || []).forEach(function (t) { wrap.appendChild(el('span', 'tag-chip', t)); });
    return wrap;
  }
  function buildActions(actions) {
    var wrap = el('div', 'actions');
    (actions || []).forEach(function (a) {
      var link = el('a', 'btn ' + (a.primary ? 'btn-primary' : 'btn-secondary'), a.label);
      link.href = a.href || '#';
      wrap.appendChild(link);
    });
    return wrap;
  }
  function buildMedia(card, cls) {
    // Returns an <img> when card.image is set, a placeholder box when only
    // card.mediaLabel is set, or null when the card has no graphic.
    if (card.image) {
      var im = el('img', cls);
      im.src = card.image;
      im.alt = card.imageAlt || card.title || '';
      im.loading = 'lazy';
      return im;
    }
    if (card.mediaLabel) return el('div', cls + ' ph-box', card.mediaLabel);
    return null;
  }
  function buildCard(card) {
    var art = el('article', 'card');
    var media = buildMedia(card, 'card-media');
    if (media) art.appendChild(media);
    var top = el('div', 'card-top');
    top.appendChild(el('div', 'card-eyebrow', card.eyebrow || ''));
    if (card.flag) top.appendChild(el('span', 'flag', card.flag));
    art.appendChild(top);
    art.appendChild(el('h3', null, card.title || ''));
    if (card.meta) art.appendChild(el('div', 'meta', card.meta));
    art.appendChild(el('div', 'desc', card.description || ''));
    if (card.tags && card.tags.length) art.appendChild(buildTags(card.tags));
    if (card.supports) art.appendChild(el('div', 'supports', card.supports));
    if (card.proves) art.appendChild(el('div', 'proves', card.proves));
    art.appendChild(buildActions(card.actions));
    return art;
  }
  function buildFeatured(card) {
    var host = document.getElementById('featured');
    if (!host || !card) return;
    host.innerHTML = '';
    var fmedia = buildMedia(card, 'feat-media');
    if (!fmedia) fmedia = el('div', 'feat-media ph-box', 'Project visual: dashboard or diagram');
    host.appendChild(fmedia);
    var body = el('div', 'feat-body');
    var top = el('div', 'feat-top');
    top.appendChild(el('span', 'feat-eyebrow', 'Featured project'));
    if (card.flag) top.appendChild(el('span', 'flag', card.flag));
    body.appendChild(top);
    body.appendChild(el('h2', 'feat-title', card.title || ''));
    if (card.meta) body.appendChild(el('div', 'meta', card.meta));
    body.appendChild(el('div', 'feat-desc', card.description || ''));
    if (card.tags && card.tags.length) body.appendChild(buildTags(card.tags));
    body.appendChild(buildActions(card.actions));
    host.appendChild(body);
  }
  function gridFor(sectionId) {
    var scope = document.getElementById(sectionId);
    return scope ? scope.querySelector('.grid-flex') : null;
  }
  function setShown(node, shown) { if (node) node.classList.toggle('is-hidden', !shown); }
  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('Failed to load ' + url);
      return r.json();
    });
  }

  var allSectionIds = ['sales-ops', 'marketing-ops', 'sales-dev', 'retention', 'ai-automation', 'sys-process', 'sys-custom', 'sys-research', 'sys-other'];
  function clearAll() { allSectionIds.forEach(function (id) { var g = gridFor(id); if (g) g.innerHTML = ''; }); }

  function tidyEmpty() {
    var subIds = ['sys-process', 'sys-custom', 'sys-research', 'sys-other'];
    subIds.forEach(function (id) {
      var g = gridFor(id); var has = g && g.children.length > 0;
      setShown(document.getElementById(id), has);
      setShown(document.querySelector('.anchornav a[data-spy="' + id + '"]'), has);
    });
    var mainIds = ['sales-ops', 'marketing-ops', 'sales-dev', 'retention', 'ai-automation'];
    mainIds.forEach(function (id) {
      var g = gridFor(id); var has = g && g.children.length > 0;
      setShown(document.getElementById(id), has);
      setShown(document.querySelector('.anchornav a[data-spy="' + id + '"]'), has);
    });
    var anySub = subIds.some(function (id) { var g = gridFor(id); return g && g.children.length > 0; });
    setShown(document.getElementById('systems'), anySub);
    setShown(document.querySelector('.anchornav a[data-spy="systems"]'), anySub);
    setShown(document.querySelector('.anchornav .sub-links'), anySub);
    tidyNavGroups();
  }
  function tidyNavGroups() {
    var nav = document.querySelector('.anchornav');
    if (!nav) return;
    var kids = Array.prototype.slice.call(nav.children);
    kids.forEach(function (node, i) {
      if (!node.classList.contains('grp')) return;
      var anyVisible = false;
      for (var j = i + 1; j < kids.length; j++) {
        if (kids[j].classList.contains('grp')) break;
        if (kids[j].tagName === 'A' && kids[j].style.display !== 'none') anyVisible = true;
        if (kids[j].classList.contains('sub-links')) {
          var subs = Array.prototype.slice.call(kids[j].querySelectorAll('a'));
          if (subs.some(function (a) { return a.style.display !== 'none'; })) anyVisible = true;
        }
      }
      setShown(node, anyVisible);
    });
  }

  function applyManifest(manifest, cache) {
    if (manifest.headline) { var h = document.getElementById('page-headline'); if (h) h.textContent = manifest.headline; }
    if (manifest.positioning) {
      var pb = document.querySelector('.positioning-body');
      if (pb) { pb.innerHTML = ''; pb.appendChild(el('div', 'positioning-text', manifest.positioning)); }
    }
    clearAll();
    if (manifest.featured && cache[manifest.featured]) buildFeatured(cache[manifest.featured]);
    var sections = manifest.sections || {};
    Object.keys(sections).forEach(function (sectionId) {
      var grid = gridFor(sectionId);
      if (!grid) return;
      (sections[sectionId] || []).forEach(function (id) { if (cache[id]) grid.appendChild(buildCard(cache[id])); });
    });
    tidyEmpty();
  }

  function loadReferenced(manifest) {
    var ids = [];
    var sections = manifest.sections || {};
    Object.keys(sections).forEach(function (k) { ids = ids.concat(sections[k] || []); });
    if (manifest.featured) ids.push(manifest.featured);
    ids = ids.filter(function (id, i) { return ids.indexOf(id) === i; });
    var cache = {};
    return Promise.all(ids.map(function (id) {
      return fetchJSON('cards/' + id + '.json').then(function (c) { cache[id] = c; }).catch(function () { cache[id] = null; });
    })).then(function () { return cache; });
  }

  fetchJSON('audiences/' + audience + '.json')
    .then(function (manifest) { return loadReferenced(manifest).then(function (cache) { return { m: manifest, c: cache }; }); })
    .then(function (res) { clearTimeout(timer); applyManifest(res.m, res.c); })
    .catch(function (e) {
      clearTimeout(timer);
      console.error(e);
      showError('Could not load the "' + audience + '" view. Showing the default. Reload the page, remove the ?audience part from the link, or open the site over http (for example on GitHub Pages).');
    });
})();
