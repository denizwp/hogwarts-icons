(function () {
  var BASE = 'https://cdn.tools.deniz.cyou/';
  var CHUNK = 240;
  var ROOT = document.documentElement.dataset.root || '';
  var EN = document.documentElement.lang === 'en';
  var T = EN
    ? { all: 'All', icons: ' icons', copied: 'Copied', failed: 'Could not load the list.', locale: 'en-US' }
    : { all: 'Tümü', icons: ' ikon', copied: 'Kopyalandı', failed: 'Liste yüklenemedi.', locale: 'tr-TR' };
  var fmt = function (n) { return n.toLocaleString(T.locale); };
  var NAMES = {};
  var items = [];
  var root = { name: '', label: '', path: '', count: 0, kids: {} };
  var closed = {};
  var state = { node: '', q: '' };
  var list = [];
  var shown = 0;
  var current = -1;
  var $ = function (id) { return document.getElementById(id); };

  function readHash() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    var i = h.indexOf('?');
    state.node = (i < 0 ? h : h.slice(0, i)).replace(/\/+$/, '');
    state.q = i < 0 ? '' : new URLSearchParams(h.slice(i + 1)).get('q') || '';
  }

  function writeHash() {
    history.replaceState(null, '', '#/' + state.node + (state.q ? '?q=' + encodeURIComponent(state.q) : ''));
  }

  function build(dirs) {
    var prefix = ROOT ? ROOT + '/' : '';
    Object.keys(dirs).sort().forEach(function (dir) {
      if (prefix && dir.indexOf(prefix) !== 0) return;
      var rel = dir.slice(prefix.length);
      var node = root;
      var path = '';
      rel.split('/').forEach(function (p) {
        path = path ? path + '/' + p : p;
        node = node.kids[p] || (node.kids[p] = { name: p, label: nodeLabel(path, p), path: path, count: 0, kids: {} });
      });
      dirs[dir].forEach(function (file) {
        var path = dir + '/' + file;
        var label = EN ? NAMES[baseName(path)] || pretty(file) : baseName(file);
        items.push({ dir: rel, file: file, path: path, rel: rel + '/' + file, label: label, lower: (rel + '/' + file + ' ' + label).toLowerCase() });
      });
    });
    items.forEach(function (it) {
      var node = root;
      root.count++;
      it.dir.split('/').forEach(function (p) {
        node = node.kids[p];
        node.count++;
      });
      if (EN) it.lower += ' ' + dirLabel(it.dir, 0).toLowerCase();
    });
  }

  function nodeLabel(path, name) {
    if (!EN) return name;
    return NAMES[(ROOT ? ROOT + '/' : '') + path] || name.charAt(0).toUpperCase() + name.slice(1);
  }

  function dirLabel(dir, skip) {
    var node = root;
    var out = [];
    dir.split('/').forEach(function (p) {
      node = node && node.kids[p];
      if (node) out.push(node.label);
    });
    return out.slice(skip).join(' / ');
  }

  function find(path) {
    if (!path) return root;
    var node = root;
    var parts = path.split('/');
    for (var i = 0; i < parts.length; i++) {
      node = node.kids[parts[i]];
      if (!node) return null;
    }
    return node;
  }

  function sortedKids(node) {
    return Object.keys(node.kids).sort(function (a, b) {
      if (a === 'wychwood') return -1;
      if (b === 'wychwood') return 1;
      return node.kids[a].label.localeCompare(node.kids[b].label, T.locale);
    }).map(function (k) { return node.kids[k]; });
  }

  function renderTree() {
    var ul = $('tree');
    ul.innerHTML = '';
    var top = document.createElement('li');
    top.appendChild(nodeButton(root, T.all, false));
    ul.appendChild(top);
    sortedKids(root).forEach(function (n) { ul.appendChild(branch(n)); });
  }

  function nodeButton(node, label, hasKids) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'node';
    if (node.path === state.node) b.setAttribute('aria-current', 'true');
    var car = document.createElement('span');
    car.className = 'car';
    car.textContent = hasKids ? (closed[node.path] ? '▸' : '▾') : '';
    var nm = document.createElement('span');
    nm.className = 'nm';
    nm.textContent = label;
    var ct = document.createElement('span');
    ct.className = 'ct';
    ct.textContent = fmt(node.count);
    b.append(car, nm, ct);
    b.addEventListener('click', function () {
      if (hasKids) closed[node.path] = node.path === state.node ? !closed[node.path] : false;
      select(node.path);
      document.body.classList.remove('nav');
    });
    return b;
  }

  function branch(node) {
    var kids = sortedKids(node);
    var li = document.createElement('li');
    li.appendChild(nodeButton(node, node.label, kids.length > 0));
    if (kids.length && !closed[node.path]) {
      var ul = document.createElement('ul');
      kids.forEach(function (k) { ul.appendChild(branch(k)); });
      li.appendChild(ul);
    }
    return li;
  }

  function renderCrumbs() {
    var el = $('crumbs');
    el.innerHTML = '';
    var all = document.createElement('button');
    all.type = 'button';
    all.textContent = T.all;
    all.onclick = function () { select(''); };
    el.appendChild(all);
    if (!state.node) return;
    var path = '';
    state.node.split('/').forEach(function (p) {
      path = path ? path + '/' + p : p;
      var sep = document.createElement('span');
      sep.textContent = '/';
      var target = path;
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = find(target).label;
      b.onclick = function () { select(target); };
      el.append(sep, b);
    });
  }

  function baseName(file) {
    return file.replace(/\.[a-z0-9]+$/i, '');
  }

  function pretty(file) {
    return baseName(file)
      .replace(/^MOD_/, '')
      .replace(/_UI(_T)?_/, ' – ')
      .replace(/^UI(_T)?_/, '')
      .replace(/^wy_/, '')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function filter() {
    var prefix = state.node ? state.node + '/' : '';
    var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    list = items.filter(function (it) {
      if (prefix && it.rel.indexOf(prefix) !== 0) return false;
      for (var i = 0; i < words.length; i++) if (it.lower.indexOf(words[i]) < 0) return false;
      return true;
    });
    shown = 0;
    $('grid').innerHTML = '';
    $('empty').hidden = list.length > 0;
    $('count').textContent = fmt(list.length) + T.icons;
    more();
  }

  function urlOf(it) {
    return BASE + it.path.split('/').map(encodeURIComponent).join('/');
  }

  function more() {
    var end = Math.min(list.length, shown + CHUNK);
    var frag = document.createDocumentFragment();
    for (var i = shown; i < end; i++) {
      var it = list[i];
      var fig = document.createElement('figure');
      fig.tabIndex = 0;
      fig.title = it.rel;
      fig.dataset.i = i;
      var img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = it.file;
      img.src = urlOf(it);
      var cap = document.createElement('figcaption');
      var name = document.createElement('b');
      name.textContent = it.label;
      var dir = document.createElement('small');
      dir.textContent = dirLabel(it.dir, state.node ? state.node.split('/').length : 0) || ' ';
      cap.append(name, dir);
      fig.append(img, cap);
      frag.appendChild(fig);
    }
    $('grid').appendChild(frag);
    shown = end;
  }

  function select(path) {
    state.node = find(path) ? path : '';
    writeHash();
    renderTree();
    renderCrumbs();
    filter();
    document.querySelector('main').scrollTop = 0;
  }

  function copy(text, btn) {
    var done = function () {
      var label = btn.textContent;
      btn.textContent = T.copied;
      btn.classList.add('ok');
      setTimeout(function () { btn.textContent = label; btn.classList.remove('ok'); }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    } else {
      fallback(text);
      done();
    }
  }

  function fallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  function show(i) {
    if (i < 0 || i >= list.length) return;
    current = i;
    var it = list[i];
    var url = urlOf(it);
    $('d-title').textContent = it.label;
    $('d-img').src = url;
    $('d-img').alt = it.file;
    $('d-dim').textContent = '';
    $('d-url').value = url;
    $('d-path').value = it.path;
    $('d-name').value = baseName(it.file);
    $('d-open').href = url;
    $('d-pos').textContent = fmt(i + 1) + ' / ' + fmt(list.length);
    var dlg = $('dlg');
    if (!dlg.open) dlg.showModal();
  }

  function step(delta) {
    var next = current + delta;
    if (next < 0 || next >= list.length) return;
    while (next >= shown) more();
    show(next);
  }

  $('d-img').addEventListener('load', function (e) {
    $('d-dim').textContent = e.target.naturalWidth + '×' + e.target.naturalHeight;
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    btn.addEventListener('click', function () { copy($(btn.dataset.copy).value, btn); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.row input'), function (input) {
    input.addEventListener('focus', function () { input.select(); });
  });

  $('d-close').addEventListener('click', function () { $('dlg').close(); });
  $('d-prev').addEventListener('click', function () { step(-1); });
  $('d-next').addEventListener('click', function () { step(1); });
  $('dlg').addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  $('dlg').addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  $('grid').addEventListener('click', function (e) {
    var fig = e.target.closest('figure');
    if (fig) show(Number(fig.dataset.i));
  });
  $('grid').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var fig = e.target.closest('figure');
    if (!fig) return;
    e.preventDefault();
    show(Number(fig.dataset.i));
  });

  var qTimer;
  $('q').addEventListener('input', function (e) {
    clearTimeout(qTimer);
    qTimer = setTimeout(function () {
      state.q = e.target.value.trim();
      writeHash();
      filter();
    }, 150);
  });

  $('toggle').addEventListener('click', function () { document.body.classList.toggle('nav'); });

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting && shown < list.length) more();
  }, { root: document.querySelector('main'), rootMargin: '600px' }).observe($('more'));

  readHash();
  $('q').value = state.q;

  var namesReady = EN
    ? fetch('/names.en.json', { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .then(function (n) { NAMES = n || {}; }, function () {})
    : Promise.resolve();

  namesReady
    .then(function () { return fetch('/index.json', { cache: 'no-cache' }); })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      build(data.dirs || {});
      $('total').textContent = fmt(root.count) + T.icons;
      select(state.node);
    })
    .catch(function () {
      $('empty').hidden = false;
      $('empty').textContent = T.failed;
    });
})();
