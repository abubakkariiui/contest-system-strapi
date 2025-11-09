import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getHistory } from '../services/api.js';

const formatDateTime = (value) => {
  if (!value) {
    return 'TBD';
  }
  return new Date(value).toLocaleString();
};

const AccountHistoryPage = () => {
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
        const data = await getHistory(token);
        if (active) {
          setItems(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load contest history.');
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
      <h1>Contest History</h1>
      {loading && <p>Loading your submissions...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <>
          {items.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contest</th>
                  <th>Score</th>
                  <th>Submitted</th>
                  <th>Prize</th>
                </tr>
              </thead>
              <tbody>
                {items.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <strong>{entry.contest?.name || 'Unknown contest'}</strong>
                      <div className="muted small">{entry.contest?.prizeTitle}</div>
                    </td>
                    <td>
                      {entry.score} / {entry.totalPoints}
                    </td>
                    <td>{formatDateTime(entry.submittedAt)}</td>
                    <td>{entry.prizeAwarded ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>You have not submitted any contests yet.</p>
          )}
        </>
      )}
    </section>
  );
};

export default AccountHistoryPage;
