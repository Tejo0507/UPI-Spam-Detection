(function () {
  const USERS_KEY = 'upi_fd_users';
  const SESSION_KEY = 'upi_fd_session_user';

  function getUsers() {
    try {
      const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
      return [];
    }
  }

  function setUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSessionUser() {
    try {
      const value = localStorage.getItem(SESSION_KEY);
      return value ? JSON.parse(value) : null;
    } catch (_err) {
      return null;
    }
  }

  function setSessionUser(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function clearSessionUser() {
    localStorage.removeItem(SESSION_KEY);
  }

  function hashPassword(password) {
    let hash = 2166136261;
    for (let i = 0; i < password.length; i += 1) {
      hash ^= password.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
  }

  function setActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('[data-nav]').forEach((link) => {
      const target = link.getAttribute('href').split('/').pop();
      if (target === current) {
        link.classList.add('active');
      }
    });
  }

  function setupNavAuth() {
    const user = getSessionUser();
    const authLink = document.getElementById('auth-link');
    const logoutBtn = document.getElementById('logout-btn');
    const userLabel = document.getElementById('user-label');

    if (authLink) {
      authLink.classList.toggle('hidden', !!user);
    }

    if (logoutBtn) {
      logoutBtn.classList.toggle('hidden', !user);
      logoutBtn.addEventListener('click', () => {
        clearSessionUser();
        window.location.href = '/auth.html';
      });
    }

    if (userLabel) {
      userLabel.textContent = user ? `Signed in: ${user.name}` : 'Not signed in';
    }
  }

  function protectPage() {
    const body = document.body;
    if (!body || body.dataset.protected !== 'true') {
      return;
    }
    const user = getSessionUser();
    if (!user) {
      const next = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth.html?next=${next}`;
    }
  }

  function attachFooterYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  function setupPageTransitions() {
    const body = document.body;
    if (!body) {
      return;
    }

    document.querySelectorAll('a[href]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        const href = anchor.getAttribute('href') || '';
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          return;
        }
        if (anchor.target && anchor.target !== '_self') {
          return;
        }

        const targetUrl = new URL(href, window.location.origin);
        if (targetUrl.origin !== window.location.origin) {
          return;
        }
        if (targetUrl.pathname === window.location.pathname && targetUrl.hash === window.location.hash) {
          return;
        }

        event.preventDefault();
        body.classList.add('page-leave');
        setTimeout(() => {
          window.location.href = targetUrl.toString();
        }, 180);
      });
    });
  }

  window.UPIApp = {
    getUsers,
    setUsers,
    getSessionUser,
    setSessionUser,
    clearSessionUser,
    hashPassword
  };

  document.addEventListener('DOMContentLoaded', () => {
    protectPage();
    setActiveNav();
    setupNavAuth();
    attachFooterYear();
    setupPageTransitions();
  });
})();
