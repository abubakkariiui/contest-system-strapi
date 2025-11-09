import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getPrizes } from '../services/api.js';

const formatDateTime = (value) => {
  if (!value) {
    return 'Unknown';
  }
  return new Date(value).toLocaleString();
};

const AccountPrizesPage = () => {
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
        const data = await getPrizes(token);
        if (active) {
          setItems(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load prizes.');
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
      <h1>Prizes Won</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <>
          {items.length ? (
            <ul className="list">
              {items.map((entry) => (
                <li key={entry.id} className="list-item column">
                  <div>
                    <strong>{entry.contest?.prizeTitle || 'Prize'}</strong>
                    <div className="muted small">
                      {entry.contest?.name} · Awarded {formatDateTime(entry.submittedAt)}
                    </div>
                  </div>
                  {entry.contest?.prizeDescription ? (
                    <p className="muted small">{entry.contest.prizeDescription}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p>No prizes earned yet. Keep competing!</p>
          )}
        </>
      )}
    </section>
  );
};

export default AccountPrizesPage;
