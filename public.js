(function () {
  const API_BASE = location.origin;
  const body = document.getElementById('topBody');
  const timerEl = document.getElementById('timer');

  const KEY = 'countdownEndsAt';
  const url = new URL(window.location.href);
  if (url.searchParams.has('reset')) {
    localStorage.removeItem(KEY);
  }
  let endsAt = parseInt(localStorage.getItem(KEY) || '0', 10);
  const now = Date.now();
  if (!endsAt || endsAt < now) {
    endsAt = now + 6 * 60 * 60 * 1000;
    localStorage.setItem(KEY, String(endsAt));
  }

  function fmt(t) { return t.toString().padStart(2, '0'); }

  function updateTimer() {
    const ms = Math.max(0, endsAt - Date.now());
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    timerEl.textContent = `${fmt(h)}h ${fmt(m)}m ${fmt(s)}s`;
  }

  async function fetchTop3() {
    try {
      const res = await fetch(`${API_BASE}/api/top-teams`);
      const data = await res.json();
      body.innerHTML = '';
      data.forEach((row) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="rank">#${row.rank}</td>
          <td>${row.team_name}</td>
          <td>${row.score}</td>
        `;
        body.appendChild(tr);
      });
    } catch (e) {
      console.error(e);
    }
  }

  updateTimer();
  setInterval(updateTimer, 1000);
  fetchTop3();
  setInterval(fetchTop3, 5000);
})();