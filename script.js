(function () {
  'use strict';

  var gate = document.getElementById('gate');
  var site = document.getElementById('site');
  var form = document.getElementById('gateForm');
  var pw = document.getElementById('pw');
  var err = document.getElementById('err');

  /* SHA-256 hashes of the accepted passwords (spaces removed, lowercase).
     To change the password: run in a browser console or Node:
     crypto.subtle.digest('SHA-256', new TextEncoder().encode('newpasswordwithoutspaces'))
     and put the hex result here. */
  var HASHES = [
    '93d9ba6aea8cf25de939fd26e969aef4ec5effa7866a6b4f42d99f60aee1a4ea',
    '5535acb4829e9057534c2abb4e13b63512c1bd6b47a9fe94285ca252d761e7a4',
    '31a890693d05b01fa46728b7e19ca188f2443c546e104564c3e056bf4b913fa9',
    'd009ba4b2d6b6b305bc97a223031df5f1b1a9f4ee6b5299a036e536ec8bf71ee'
  ];

  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[ً-ٟـ]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/[^\p{L}\p{N}]/gu, '');
  }

  function sha256(text) {
    var data = new TextEncoder().encode(text);
    if (window.crypto && window.crypto.subtle && window.isSecureContext) {
      try {
        return crypto.subtle.digest('SHA-256', data).then(function (buf) {
          return Array.prototype.map.call(new Uint8Array(buf), function (b) {
            return ('0' + b.toString(16)).slice(-2);
          }).join('');
        }).catch(function () { return sha256Fallback(text); });
      } catch (e) { /* fall through */ }
    }
    return Promise.resolve(sha256Fallback(text));
  }

  /*FB-START*/
  function sha256Fallback(str) {
    var rr = function (v, a) { return (v >>> a) | (v << (32 - a)); };
    var maxWord = Math.pow(2, 32), i, j, result = '';
    var words = [], hash = [], k = [], composite = {};
    var bytes = Array.prototype.slice.call(new TextEncoder().encode(str));
    var bitLen = bytes.length * 8;
    for (var cand = 2, pc = 0; pc < 64; cand++) {
      if (!composite[cand]) {
        for (i = 0; i < 313; i += cand) composite[i] = cand;
        hash[pc] = (Math.pow(cand, 0.5) * maxWord) | 0;
        k[pc++] = (Math.pow(cand, 1 / 3) * maxWord) | 0;
      }
    }
    bytes.push(0x80);
    while (bytes.length % 64 - 56) bytes.push(0);
    for (i = 0; i < bytes.length; i++) {
      words[i >> 2] = (words[i >> 2] | 0) | (bytes[i] << ((3 - i) % 4) * 8);
    }
    words[words.length] = (bitLen / maxWord) | 0;
    words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16);
      var old = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
          (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }
  /*FB-END*/

  /* ---------- confetti ---------- */
  var cv = document.getElementById('fx');
  var ctx = cv.getContext('2d');
  var parts = [];
  var running = false;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var colors = ['#f2b705', '#55702a', '#1f5fd1', '#e8553d', '#ffffff'];

  function size() { cv.width = window.innerWidth; cv.height = window.innerHeight; }
  window.addEventListener('resize', size);
  size();

  function burst() {
    if (reduce) return;
    for (var i = 0; i < 120; i++) {
      parts.push({
        x: Math.random() * cv.width,
        y: -20 - Math.random() * cv.height * 0.3,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.3,
        c: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }

  function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(function (p) { return p.y < cv.height + 30; });
    parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (parts.length) { requestAnimationFrame(tick); }
    else { running = false; ctx.clearRect(0, 0, cv.width, cv.height); }
  }

  /* ---------- gate ---------- */
  function unlock(withConfetti) {
    gate.hidden = true;
    site.hidden = false;
    err.textContent = '';
    window.scrollTo(0, 0);
    if (withConfetti) burst();
  }

  try {
    if (sessionStorage.getItem('alim-unlocked') === '1') { unlock(false); }
  } catch (e) { /* storage may be blocked */ }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    sha256(norm(pw.value)).then(function (h) {
      if (HASHES.indexOf(h) !== -1) {
        try { sessionStorage.setItem('alim-unlocked', '1'); } catch (e2) {}
        unlock(true);
      } else {
        err.textContent = 'كلمة السر غالطة يا خويا، عاود.';
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
        pw.select();
      }
    }).catch(function () {
      err.textContent = 'المتصفح ما يدعمش التحقق. افتح الموقع من رابط https.';
    });
  });

  /* ---------- wishes ---------- */
  var wishes = [
    'كل عام وأنت بخير يا عليم',
    'الله يخليك بشوش كيما أنت',
    'عام جديد وضحكة أكبر',
    'بوجلال المنضبط يستاهل الأحسن',
    'الطيار المخفي ظهر اليوم لأنه عيد ميلادو',
    'برميسيو مفتوح لليوم كامل',
    'عام وشوية صحبة، وبإذن الله العمر كامل'
  ];
  var n = 0;
  document.getElementById('partyBtn').addEventListener('click', function () {
    n = (n + 1) % wishes.length;
    document.getElementById('wish').textContent = wishes[n];
    burst();
  });

  /* ---------- lightbox ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lastFocus = null;

  function openLb(btn) {
    lastFocus = btn;
    lbImg.src = btn.getAttribute('data-src');
    lbImg.alt = btn.getAttribute('data-cap') || '';
    lbCap.textContent = btn.getAttribute('data-cap') || '';
    lb.hidden = false;
    document.getElementById('lbClose').focus();
  }
  function closeLb() {
    lb.hidden = true;
    lbImg.removeAttribute('src');
    if (lastFocus) lastFocus.focus();
  }
  Array.prototype.forEach.call(document.querySelectorAll('.open'), function (b) {
    b.addEventListener('click', function () { openLb(b); });
  });
  document.getElementById('lbClose').addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLb(); });
})();
