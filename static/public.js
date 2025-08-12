(function () {
  const API_BASE = location.origin;

  /* ---------- Countdown (6 hours per device) ---------- */
  const timerEl = document.getElementById('timer');
  const KEY = 'countdownEndsAt';
  const url = new URL(window.location.href);
  if (url.searchParams.has('reset')) localStorage.removeItem(KEY);

  let endsAt = parseInt(localStorage.getItem(KEY) || '0', 10);
  const now = Date.now();
  if (!endsAt || endsAt < now) {
    endsAt = now + 6 * 60 * 60 * 1000; // 6h
    localStorage.setItem(KEY, String(endsAt));
  }
  function fmt(t){ return t.toString().padStart(2,'0'); }
  function updateTimer(){
    const ms = Math.max(0, endsAt - Date.now());
    const total = Math.floor(ms/1000), h = Math.floor(total/3600), m = Math.floor((total%3600)/60), s = total%60;
    if (timerEl) timerEl.textContent = `${fmt(h)}h ${fmt(m)}m ${fmt(s)}s`;
  }
  updateTimer(); setInterval(updateTimer, 1000);

  /* ---------- Podium: #1, #2, #3 ---------- */
  const els = {
    1: { name: document.getElementById('first-name'), score: document.getElementById('first-score') },
    2: { name: document.getElementById('second-name'), score: document.getElementById('second-score') },
    3: { name: document.getElementById('third-name'), score: document.getElementById('third-score') },
  };

  async function fetchTop3() {
    try {
      const res = await fetch(`${API_BASE}/api/top-teams`, { cache: "no-store" });
      const data = await res.json();
      for (let r = 1; r <= 3; r++) {
        const row = data[r-1];
        els[r].name.textContent = row ? row.team_name : '—';
        els[r].score.textContent = row ? row.score : 0;
      }
    } catch (e) {
      console.error('Failed to fetch top teams', e);
    }
  }
  fetchTop3(); setInterval(fetchTop3, 5000);

  /* ---------- Sponsors marquee (bigger + seamless loop) ---------- */
  // 1) Put your sponsor images in: static/sponsors/
  // 2) List the filenames below:
  const SPONSOR_LOGOS = [
    "sponsors/logo1.png",
    "sponsors/logo2.png",
    "sponsors/logo3.png",
    "sponsors/logo4.png"
  ];

  const marquee = document.getElementById('marquee');
  const track = document.getElementById('sponsorTrack');
  const clone = document.getElementById('sponsorTrackClone');

  function makeTile(src){
    const wrap = document.createElement('div');
    wrap.className = 'sponsor';
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Sponsor logo';
    wrap.appendChild(img);
    return wrap;
  }

  async function buildMarquee() {
    if (!marquee || !track || !clone) return;

    // Build base content
    track.innerHTML = '';
    SPONSOR_LOGOS.forEach(src => track.appendChild(makeTile(src)));

    // Duplicate until track width is at least viewport*2 (so it loops without gaps)
    await new Promise(r => requestAnimationFrame(r)); // allow layout
    const vw = marquee.clientWidth || window.innerWidth;
    while (track.scrollWidth < vw * 2) {
      SPONSOR_LOGOS.forEach(src => track.appendChild(makeTile(src)));
    }

    // Clone track for continuous scroll
    clone.innerHTML = track.innerHTML;

    // Set animation duration based on content width (px/sec speed)
    const speed = 120; // px per second (tweak to taste)
    const duration = Math.max(18, Math.round(track.scrollWidth / speed));
    marquee.style.setProperty('--marquee-duration', `${duration}s`);
  }

  window.addEventListener('load', buildMarquee);
  window.addEventListener('resize', () => {
    // Rebuild on resize to maintain loop
    clearTimeout(window.__mq);
    window.__mq = setTimeout(buildMarquee, 250);
  });
})();
