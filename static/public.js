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
      // Fill with defaults in case we have <3 teams
      for (let r = 1; r <= 3; r++) {
        const row = data[r-1];
        const name = row ? row.team_name : '—';
        const score = row ? row.score : 0;
        els[r].name.textContent = name;
        els[r].score.textContent = score;
      }
    } catch (e) {
      console.error('Failed to fetch top teams', e);
    }
  }
  fetchTop3(); setInterval(fetchTop3, 5000);

  /* ---------- Sponsors marquee ---------- */
  // 1) Put your sponsor logo files in: static/sponsors/
  // 2) List them here (filenames only). Example placeholders:
  const SPONSOR_LOGOS = [
    "sponsors/logo1.png",
    "sponsors/logo2.png",
    "sponsors/logo3.png",
    "sponsors/logo4.png"
  ];
  const track = document.getElementById('sponsorTrack');
  const clone = document.getElementById('sponsorTrackClone');

  function buildTrack(intoEl) {
    intoEl.innerHTML = '';
    SPONSOR_LOGOS.forEach(src => {
      const wrap = document.createElement('div');
      wrap.className = 'sponsor';
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Sponsor logo';
      wrap.appendChild(img);
      intoEl.appendChild(wrap);
    });
  }
  if (track && clone) {
    buildTrack(track);
    buildTrack(clone);
  }
})();
