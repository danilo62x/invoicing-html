/* ===== Auth (mock) — mirrors React useAuthStore. Persist key: "iv-auth" =====
   Any non-empty email/password logs in. Demo: financeiro@contacerta.com / demo123.
   requireAuth() guards app pages -> login.html?redirect=... */
(function (global) {
  const STORAGE_KEY = 'iv-auth';
  const DEMO_CREDENTIALS = { email: 'financeiro@contacerta.com', password: 'demo123' };

  let user = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) user = JSON.parse(raw).user || null;
  } catch (_) {}

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
    } catch (_) {}
  }

  function isAuthenticated() {
    return user !== null;
  }
  function getUser() {
    return user;
  }

  // Mock auth: any non-empty email/password logs in.
  function login(email, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!email || !password) return resolve(false);
        const isDemo = email === DEMO_CREDENTIALS.email;
        const raw = email.split('@')[0].replace(/[._-]/g, ' ') || 'Financeiro';
        const name = isDemo ? 'Camila Duarte' : raw.charAt(0).toUpperCase() + raw.slice(1);
        user = { id: 1, name, email, role: 'Financeiro', company: 'Conta Certa Serviços' };
        persist();
        resolve(true);
      }, 500);
    });
  }

  function register(name, email, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!name || !email || !password) return resolve(false);
        user = { id: 1, name, email, role: 'Financeiro', company: '' };
        persist();
        resolve(true);
      }, 500);
    });
  }

  function logout() {
    user = null;
    persist();
  }

  function updateProfile(patch) {
    if (!user) return;
    user = { ...user, ...patch };
    persist();
  }

  // Redirect to login.html?redirect=<current page> when not authenticated.
  function requireAuth() {
    if (!isAuthenticated()) {
      const here = window.location.pathname.split('/').pop() || 'index.html';
      const search = window.location.search || '';
      const redirect = encodeURIComponent(here + search);
      window.location.href = `login.html?redirect=${redirect}`;
      return false;
    }
    return true;
  }

  global.Auth = {
    DEMO_CREDENTIALS,
    isAuthenticated,
    getUser,
    login,
    register,
    logout,
    updateProfile,
    requireAuth,
  };
})(window);
