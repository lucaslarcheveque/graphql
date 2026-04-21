import { login } from './auth.js';

export function renderLogin(onSuccess) {
  const view = document.getElementById('login-view');

  view.innerHTML = `
    <div class="login-card">
      <div class="logo">
        <h1>Zone01</h1>
        <p>Sign in to view your profile</p>
      </div>
      <form id="login-form" novalidate>
        <div class="form-group">
          <label for="identifier">Username or Email</label>
          <input id="identifier" type="text" placeholder="john.doe" autocomplete="username" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" type="password" placeholder="••••••••" autocomplete="current-password" required />
        </div>
        <button type="submit" class="btn btn-primary" id="login-btn">Sign in</button>
        <div id="login-error" style="display:none" class="error-msg"></div>
      </form>
    </div>
  `;

  const form   = view.querySelector('#login-form');
  const btn    = view.querySelector('#login-btn');
  const errDiv = view.querySelector('#login-error');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const identifier = view.querySelector('#identifier').value.trim();
    const password   = view.querySelector('#password').value;

    if (!identifier || !password) {
      showError('Please enter your username/email and password.');
      return;
    }

    btn.disabled     = true;
    btn.textContent  = 'Signing in…';
    errDiv.style.display = 'none';

    try {
      await login(identifier, password);
      onSuccess();
    } catch (err) {
      showError(err.message.includes('401') || err.message.includes('Invalid')
        ? 'Invalid credentials. Please try again.'
        : err.message || 'Login failed. Please try again.');
      btn.disabled    = false;
      btn.textContent = 'Sign in';
    }
  });

  function showError(msg) {
    errDiv.textContent     = msg;
    errDiv.style.display   = 'block';
  }
}
