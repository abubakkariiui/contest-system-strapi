import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, status } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await register({ username, email, password });
      navigate('/contests', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to register. Please try again.');
    }
  };

  return (
    <section className="panel form-panel">
      <h1>Create an account</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button
          type="submit"
          className="button button-primary"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p className="muted">
        Already have an account? <Link to="/login">Sign in here</Link>.
      </p>
    </section>
  );
};

export default RegisterPage;
