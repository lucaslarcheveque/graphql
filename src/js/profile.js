import { logout } from './auth.js';
import {
  query,
  Q_USER, Q_XP_TRANSACTIONS, Q_XP_BY_PROJECT,
  Q_AUDIT_RATIO, Q_RESULTS, Q_SKILLS,
} from './graphql.js';
import { renderXPLineChart, renderXPBarChart } from './graphs.js';

export async function renderProfile(onLogout) {
  const view = document.getElementById('profile-view');

  view.innerHTML = `
    <nav class="topbar">
      <span class="brand">Zone01 — Profile</span>
      <button class="btn btn-ghost" id="logout-btn">Sign out</button>
    </nav>
    <main class="profile-main" id="profile-content">
      <div class="skeleton" style="height:120px;border-radius:10px"></div>
      <div class="skeleton" style="height:90px;border-radius:10px"></div>
      <div class="skeleton" style="height:320px;border-radius:10px"></div>
    </main>
  `;

  view.querySelector('#logout-btn').addEventListener('click', () => {
    logout();
    onLogout();
  });

  try {
    const [userData, xpData, xpByProject, auditData, resultData, skillData] = await Promise.all([
      query(Q_USER),
      query(Q_XP_TRANSACTIONS),
      query(Q_XP_BY_PROJECT),
      query(Q_AUDIT_RATIO),
      query(Q_RESULTS),
      query(Q_SKILLS),
    ]);

    const user        = userData.user[0];
    const xpTx        = xpData.transaction;
    const auditUser   = auditData.user[0];
    const results     = resultData.result;

    const totalXP     = xpTx.reduce((s, t) => s + t.amount, 0);
    const auditRatio  = auditUser?.auditRatio ?? 0;
    const totalUp     = auditUser?.totalUp   ?? 0;
    const totalDown   = auditUser?.totalDown ?? 0;

    // Skills: pick highest amount per skill type
    const skillMap = new Map();
    for (const s of skillData.transaction) {
      const name = s.type.replace('skill_', '').replace(/_/g, ' ');
      if (!skillMap.has(name) || skillMap.get(name) < s.amount) skillMap.set(name, s.amount);
    }
    const topSkills = [...skillMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

    const passProjects = results.filter(r => r.object?.type === 'project' && r.grade >= 1).length;
    const failProjects = results.filter(r => r.object?.type === 'project' && r.grade < 1).length;

    const initials = (user.login || '?').slice(0, 2).toUpperCase();
    const joinDate = new Date(user.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });

    const content = document.getElementById('profile-content');
    content.innerHTML = `
      <!-- Identity -->
      <div class="card">
        <div class="card-title">Profile</div>
        <div class="identity">
          <div class="avatar">${initials}</div>
          <div class="identity-info">
            <h2>${user.login}</h2>
            <p>Member since ${joinDate}</p>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="card">
        <div class="card-title">Overview</div>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">Total XP</div>
            <div class="stat-value">${formatXP(totalXP)}</div>
            <div class="stat-sub">${xpTx.length} transactions</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Projects Passed</div>
            <div class="stat-value" style="color:var(--accent-2)">${passProjects}</div>
            <div class="stat-sub">${failProjects} failed</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Audit Ratio</div>
            <div class="stat-value" style="color:${auditRatio >= 1 ? 'var(--accent-2)' : 'var(--danger)'}">${auditRatio.toFixed(2)}</div>
            <div class="stat-sub">↑ ${formatXP(totalUp)} / ↓ ${formatXP(totalDown)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Skills</div>
            <div class="stat-value">${topSkills.length}</div>
            <div class="stat-sub">distinct skills</div>
          </div>
        </div>
      </div>

      <!-- Audit ratio bar -->
      <div class="card">
        <div class="card-title">Audit Ratio</div>
        <div class="ratio-bar-wrap">
          <div class="ratio-label-row">
            <span>Done ↑ ${formatXP(totalUp)}</span>
            <span>Received ↓ ${formatXP(totalDown)}</span>
          </div>
          <div class="ratio-bar">
            <div class="ratio-bar-fill" id="audit-fill" style="width:0%"></div>
          </div>
          <div class="ratio-label-row" style="margin-top:.4rem">
            <span style="color:var(--text-muted);font-size:.78rem">Ratio: ${auditRatio.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Graphs -->
      <div class="card">
        <div class="card-title">Statistics</div>
        <div class="graphs-grid">
          <div class="graph-container card" id="graph-xp-line" style="padding:.5rem"></div>
          <div class="graph-container card" id="graph-xp-bar" style="padding:.5rem"></div>
        </div>
      </div>

      <!-- Skills -->
      <div class="card">
        <div class="card-title">Skills</div>
        <div class="skills-list" id="skills-list"></div>
      </div>
    `;

    // Animate audit bar
    requestAnimationFrame(() => {
      const fill = document.getElementById('audit-fill');
      if (fill) {
        const pct = Math.min((totalUp / (totalUp + totalDown || 1)) * 100, 100);
        fill.style.width = pct + '%';
      }
    });

    // Render graphs
    renderXPLineChart(document.getElementById('graph-xp-line'), xpTx);
    renderXPBarChart(document.getElementById('graph-xp-bar'), xpByProject.transaction);

    // Skills chips
    const skillsEl = document.getElementById('skills-list');
    for (const [name, amount] of topSkills) {
      const chip = document.createElement('div');
      chip.className = 'skill-chip';
      chip.innerHTML = `${name} <span>${amount}%</span>`;
      skillsEl.appendChild(chip);
    }

  } catch (err) {
    if (err.message.includes('JWTExpired') || err.message.includes('JWT')) {
      logout();
      onLogout();
      return;
    }
    console.error(err);
    document.getElementById('profile-content').innerHTML = `
      <div class="card" style="color:var(--danger)">
        Failed to load profile data: ${err.message}
      </div>
    `;
  }
}

function formatXP(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} MB`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} kB`;
  return `${n} B`;
}
