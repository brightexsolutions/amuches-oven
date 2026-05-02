import { signIn, getSession, isSupabaseConfigured } from '../config.js';
import { setButtonLoading, hidePageLoader } from '../utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  hidePageLoader();

  const session = await getSession();
  if (session) {
    window.location.href = './index.html';
    return;
  }

  if (!isSupabaseConfigured) {
    document.getElementById('login-error-msg').textContent = 'Development mode is active. Use admin@amuchesoven.co.ke / admin12345.';
    document.getElementById('login-error').classList.remove('hidden');
  }

  document.getElementById('toggle-pw')?.addEventListener('click', () => {
    const input = document.getElementById('login-password');
    const icon = document.getElementById('toggle-pw-icon');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    icon.className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
  });

  document.getElementById('login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const button = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');
    const errorMsg = document.getElementById('login-error-msg');
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) return;

    errorEl.classList.add('hidden');
    setButtonLoading(button, true, 'Signing in…');

    const { error } = await signIn(email, password);
    if (error) {
      errorMsg.textContent = error.message.includes('Invalid') ? 'Invalid email or password.' : error.message;
      errorEl.classList.remove('hidden');
      setButtonLoading(button, false);
      return;
    }

    window.location.href = './index.html';
  });
});
