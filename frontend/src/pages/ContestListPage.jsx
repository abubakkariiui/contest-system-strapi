import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getContests } from '../services/api.js';

const formatDate = (value) => {
  if (!value) {
    return 'TBD';
  }
  return new Date(value).toLocaleString();
};

const ContestListPage = () => {
  const { token, user } = useAuth();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getContests(token);
        if (active) {
          setContests(list);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load contests.');
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
      <div className="panel-header">
        <h1>Available Contests</h1>
        {!user && <p className="muted">Sign in to participate and track your progress.</p>}
      </div>
      {loading && <p>Loading contests...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <div className="grid">
          {contests.map((contest) => (
            <article key={contest.id} className="card">
              <header className="card-header">
                <h2>{contest.name}</h2>
                <span className={`badge badge-${contest.accessLevel}`}>
                  {contest.accessLevel === 'vip' ? 'VIP' : 'Normal'}
                </span>
              </header>
              <p className="card-description">{contest.description || 'No description provided.'}</p>
              <dl className="meta">
                <div>
                  <dt>Starts</dt>
                  <dd>{formatDate(contest.startTime)}</dd>
                </div>
                <div>
                  <dt>Ends</dt>
                  <dd>{formatDate(contest.endTime)}</dd>
                </div>
                {contest.prizeTitle ? (
                  <div>
                    <dt>Prize</dt>
                    <dd>{contest.prizeTitle}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="card-actions">
                <Link className="button" to={`/contests/${contest.id}`}>
                  View details
                </Link>
              </div>
            </article>
          ))}
          {!contests.length && <p>No contests available right now. Please check back later.</p>}
        </div>
      )}
    </section>
  );
};

export default ContestListPage;
