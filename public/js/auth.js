(function () {
  function setMessage(container, text, kind) {
    container.textContent = text;
    container.classList.remove('hidden', 'error', 'success');
    container.classList.add(kind);
  }

  function clearMessage(container) {
    container.textContent = '';
    container.classList.add('hidden');
    container.classList.remove('error', 'success');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function getNextPath() {
    const params = new URLSearchParams(window.location.search);
    return params.get('next') || '/detector.html';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showLoginBtn = document.getElementById('show-login');
    const showSignupBtn = document.getElementById('show-signup');
    const loginMessage = document.getElementById('login-message');
    const signupMessage = document.getElementById('signup-message');

    if (!loginForm || !signupForm || !window.UPIApp) {
      return;
    }

    const sessionUser = window.UPIApp.getSessionUser();
    if (sessionUser) {
      window.location.href = '/detector.html';
      return;
    }

    function showLogin() {
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      showLoginBtn.classList.remove('btn-secondary');
      showSignupBtn.classList.add('btn-secondary');
      clearMessage(loginMessage);
      clearMessage(signupMessage);
    }

    function showSignup() {
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      showSignupBtn.classList.remove('btn-secondary');
      showLoginBtn.classList.add('btn-secondary');
      clearMessage(loginMessage);
      clearMessage(signupMessage);
    }

    showLoginBtn.addEventListener('click', showLogin);
    showSignupBtn.addEventListener('click', showSignup);

    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      clearMessage(loginMessage);

      const email = String(loginForm.email.value || '').trim().toLowerCase();
      const password = String(loginForm.password.value || '');

      if (!isValidEmail(email)) {
        setMessage(loginMessage, 'Enter a valid email address.', 'error');
        return;
      }
      if (password.length < 8) {
        setMessage(loginMessage, 'Password must be at least 8 characters.', 'error');
        return;
      }

      const users = window.UPIApp.getUsers();
      const passwordHash = window.UPIApp.hashPassword(password);
      const user = users.find((entry) => entry.email === email && entry.passwordHash === passwordHash);

      if (!user) {
        setMessage(loginMessage, 'Invalid email or password.', 'error');
        return;
      }

      window.UPIApp.setSessionUser({
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      });

      setMessage(loginMessage, 'Login successful. Redirecting...', 'success');
      window.location.href = getNextPath();
    });

    signupForm.addEventListener('submit', (event) => {
      event.preventDefault();
      clearMessage(signupMessage);

      const name = String(signupForm.name.value || '').trim();
      const email = String(signupForm.email.value || '').trim().toLowerCase();
      const password = String(signupForm.password.value || '');
      const confirmPassword = String(signupForm.confirmPassword.value || '');

      if (name.length < 3) {
        setMessage(signupMessage, 'Full name must have at least 3 characters.', 'error');
        return;
      }
      if (!isValidEmail(email)) {
        setMessage(signupMessage, 'Enter a valid email address.', 'error');
        return;
      }
      if (password.length < 8) {
        setMessage(signupMessage, 'Password must be at least 8 characters.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        setMessage(signupMessage, 'Passwords do not match.', 'error');
        return;
      }

      const users = window.UPIApp.getUsers();
      const existing = users.find((entry) => entry.email === email);
      if (existing) {
        setMessage(signupMessage, 'An account with this email already exists.', 'error');
        return;
      }

      const newUser = {
        name,
        email,
        passwordHash: window.UPIApp.hashPassword(password),
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      window.UPIApp.setUsers(users);
      window.UPIApp.setSessionUser({
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt
      });

      setMessage(signupMessage, 'Signup successful. Redirecting...', 'success');
      window.location.href = getNextPath();
    });
  });
})();
