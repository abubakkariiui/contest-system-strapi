import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getInProgress } from '../services/api.js';

const formatDateTime = (value) => {
  if (!value) {
    return 'Not started';
  }
  return new Date(value).toLocaleString();
};

const AccountInProgressPage = () => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getInProgress(token);
        if (active) {
          setItems(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load in-progress contests.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <section className="panel">
      <h1>In-progress Contests</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <>
          {items.length ? (
            <ul className="list">
              {items.map((entry) => (
                <li key={entry.id} className="list-item">
                  <div>
                    <strong>{entry.contest?.name || 'Unknown contest'}</strong>
                    <div className="muted small">
                      Started {formatDateTime(entry.startedAt)} · {entry.contest?.accessLevel}
                    </div>
                  </div>
                  <Link className="button button-small" to={`/contests/${entry.contest?.id}`}>
                    Continue
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>You have no in-progress contests.</p>
          )}
        </>
      )}
    </section>
  );
};

export default AccountInProgressPage;
