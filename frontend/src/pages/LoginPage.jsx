import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      await login({ identifier, password });
      const redirectTo = location.state?.from || '/contests';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please verify your credentials.');
    }
  };

  return (
    <section className="panel form-panel">
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Email or username
          <input
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button
          type="submit"
          className="button button-primary"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="muted">
        Need an account? <Link to="/register">Register here</Link>.
      </p>
    </section>
  );
};

export default LoginPage;
