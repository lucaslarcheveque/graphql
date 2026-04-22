import { isLoggedIn } from './auth.js';
import { renderLogin } from './login.js';
import { renderProfile } from './profile.js';

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function init() {
  if (isLoggedIn()) {
    showView('profile-view');
    renderProfile(goToLogin);
  } else {
    showView('login-view');
    renderLogin(goToProfile);
  }
}

function goToProfile() {
  showView('profile-view');
  renderProfile(goToLogin);
}

function goToLogin() {
  showView('login-view');
  renderLogin(goToProfile);
}

init();
