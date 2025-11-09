import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveRoleCode } from '../utils/access.js';

const Layout = () => {
  const navigate = useNavigate();
  const { user, status, logout } = useAuth();
  const roleCode = resolveRoleCode(user);
  const navClassName = ({ isActive }) => (isActive ? 'active' : undefined);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSyncing = status === 'loading';

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" onClick={() => navigate('/contests')}>
          Contest System
        </div>
        <nav className="app-nav">
          <NavLink to="/contests" className={navClassName}>
            Contests
          </NavLink>
          {user ? (
            <>
              <NavLink to="/account/in-progress" className={navClassName}>
                In Progress
              </NavLink>
              <NavLink to="/account/history" className={navClassName}>
                History
              </NavLink>
              <NavLink to="/account/prizes" className={navClassName}>
                Prizes
              </NavLink>
            </>
          ) : null}
        </nav>
        <div className="auth-controls">
          {isSyncing && <span className="status-pill">Syncing...</span>}
          {user ? (
            <>
              <span className="user-pill">
                {user.username}
                {roleCode && roleCode !== 'authenticated' ? ` · ${roleCode}` : ''}
              </span>
              <button type="button" className="link-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
