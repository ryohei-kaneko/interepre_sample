(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  // ヒーロー画像: 4秒ごとにフェード切り替え
  var slides = document.querySelectorAll('.hero__image img');
  if (slides.length > 1 && !reduce) {
    var si = 0;
    setInterval(function () {
      slides[si].classList.remove('is-active');
      si = (si + 1) % slides.length;
      slides[si].classList.add('is-active');
    }, 4000);
  }

  // フェードイン / 画像のワイプ表示
  var targets = document.querySelectorAll('.reveal');
  if (hasIO) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('is-visible'); });
  }

  // 現在のルックをナビでハイライト
  var links = document.querySelectorAll('.nav a');
  if (hasIO) {
    var nav = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.look').forEach(function (l) { nav.observe(l); });
  }

  // スクロール連動: 進捗バー / ヘッダー
  var bar = document.querySelector('.progress');
  var header = document.querySelector('.site-header');
  var hero = document.querySelector('.hero');
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    header.classList.toggle('is-solid', y > hero.offsetHeight - 80);
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // ライトボックス
  var lb = document.querySelector('.lb');
  var lbImg = lb.querySelector('.lb__img');
  var lbCount = lb.querySelector('.lb__count');
  var group = [], cur = 0, label = '';

  // 拡大表示の画像: スマホでは軽い1200px版を使う
  function fullSrc(img) {
    var src = img.getAttribute('src');
    return window.innerWidth <= 700 ? src.replace('-1920.', '-1200.') : src;
  }
  function preload(i) {
    var n = group[(i + group.length) % group.length];
    if (n) (new Image()).src = fullSrc(n);
  }
  function show(i) {
    cur = (i + group.length) % group.length;
    var src = fullSrc(group[cur]);
    lbImg.classList.add('is-loading');
    var tmp = new Image();
    tmp.onload = function () {
      lbImg.src = src;
      lbImg.alt = group[cur].alt;
      lbImg.classList.remove('is-loading');
    };
    tmp.src = src;
    lbCount.textContent = 'LOOK ' + label + '  —  ' +
      ('0' + (cur + 1)).slice(-2) + ' / ' + ('0' + group.length).slice(-2);
    preload(cur + 1); preload(cur - 1);
  }
  function open(imgs, i, lbl) {
    group = imgs; label = lbl;
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    show(i);
  }
  function close() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
  }

  document.querySelectorAll('.look').forEach(function (look) {
    var imgs = Array.prototype.slice.call(look.querySelectorAll('.gallery .shot img'));
    imgs.forEach(function (img, i) {
      var fig = img.closest('figure');
      fig.setAttribute('tabindex', '0');
      fig.setAttribute('role', 'button');
      fig.setAttribute('aria-label', 'View larger: ' + img.alt);
      fig.addEventListener('click', function () { open(imgs, i, look.dataset.look); });
      fig.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(imgs, i, look.dataset.look); }
      });
    });
  });

  lb.querySelector('.lb__close').addEventListener('click', close);
  lb.querySelector('.lb__prev').addEventListener('click', function (e) { e.stopPropagation(); show(cur - 1); });
  lb.querySelector('.lb__next').addEventListener('click', function (e) { e.stopPropagation(); show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
  });
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    tx = null;
  });
})();
