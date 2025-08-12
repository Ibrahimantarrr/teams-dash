(function () {
  const API_BASE = location.origin;
  const form = document.getElementById('scoreForm');
  const teamsBody = document.getElementById('teamsBody');
  const clearBtn = document.getElementById('clearAll');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const team_name = document.getElementById('team_name').value.trim();
    const scoreStr = document.getElementById('score').value;
    const score = parseInt(scoreStr, 10) || 0;
    if (!team_name) return alert('Team name required');

    try {
      await fetch(`${API_BASE}/api/set-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_name, score }),
      });
      await refresh();
      form.reset();
      document.getElementById('score').value = '0';
    } catch (e) {
      console.error(e);
      alert('Failed to save. See console for details.');
    }
  });

  clearBtn.addEventListener('click', async () => {
    if (!confirm('Clear ALL teams?')) return;
    await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
    await refresh();
  });

  async function refresh() {
    try {
      const res = await fetch(`${API_BASE}/api/teams`);
      const data = await res.json();
      teamsBody.innerHTML = '';
      data.forEach((row) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.team_name}</td>
          <td>${row.score}</td>
          <td><time>${row.last_updated}</time></td>
        `;
        teamsBody.appendChild(tr);
      });
    } catch (e) {
      console.error(e);
    }
  }

  refresh();
})();
