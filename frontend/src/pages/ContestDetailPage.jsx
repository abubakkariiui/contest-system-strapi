import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getContest,
  joinContest,
  submitContest,
  getLeaderboard,
} from '../services/api.js';
import { canAccessContest, resolveRoleCode } from '../utils/access.js';

const formatDateTime = (value) => {
  if (!value) {
    return 'TBD';
  }
  return new Date(value).toLocaleString();
};

const ContestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participation, setParticipation] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const contestId = useMemo(() => Number(id), [id]);

  useEffect(() => {
    let active = true;
    const loadContest = async () => {
      setLoading(true);
      setError(null);
      setParticipation(null);
      setAnswers({});
      setSubmissionError(null);
      setLeaderboard([]);
      setLeaderboardError(null);
      setLeaderboardLoading(false);
      try {
        const data = await getContest(contestId, token);
        if (!active) {
          return;
        }
        setContest(data);
      } catch (err) {
        if (!active) {
          return;
        }
        if (err.status === 403) {
          setError('You do not have access to view this contest.');
        } else {
          setError(err.message || 'Failed to load contest.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (!Number.isNaN(contestId)) {
      loadContest();
    } else {
      setError('Invalid contest id.');
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [contestId, token]);

  const handleJoin = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/contests/${contestId}` } });
      return;
    }

    try {
      const result = await joinContest(contestId, token);
      setParticipation(result);
    } catch (err) {
      setSubmissionError(err.message || 'Unable to join contest at this time.');
    }
  };

  const handleRadioChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleCheckboxToggle = (questionId, optionValue) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      if (current.includes(optionValue)) {
        return {
          ...prev,
          [questionId]: current.filter((entry) => entry !== optionValue),
        };
      }
      return {
        ...prev,
        [questionId]: [...current, optionValue],
      };
    });
  };

  const handleBooleanChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const selectedValues = (questionId) => answers[questionId];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!participation) {
      setSubmissionError('Join the contest before submitting your answers.');
      return;
    }

    const payload = [];
    for (const question of contest.questions || []) {
      const key = question.id;
      const storedValue = answers[key];
      if (question.type === 'multi') {
        if (Array.isArray(storedValue) && storedValue.length) {
          payload.push({
            questionId: key,
            values: storedValue,
          });
        }
      } else if (question.type === 'boolean') {
        if (storedValue === true || storedValue === false) {
          payload.push({
            questionId: key,
            value: storedValue,
          });
        }
      } else if (storedValue !== undefined && storedValue !== null && storedValue !== '') {
        payload.push({
          questionId: key,
          value: storedValue,
        });
      }
    }

    setSubmitting(true);
    setSubmissionError(null);
    try {
      const result = await submitContest(contestId, token, payload);
      setParticipation(result);
    } catch (err) {
      setSubmissionError(err.message || 'Failed to submit answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadLeaderboard = async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const data = await getLeaderboard(contestId, token);
      setLeaderboard(data);
    } catch (err) {
      setLeaderboardError(err.message || 'Unable to load leaderboard.');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const userRoleCode = resolveRoleCode(user);
  const canUserParticipate =
    contest && canAccessContest(contest.accessLevel, user);
  const hasSubmitted = participation?.status === 'submitted';

  if (loading) {
    return (
      <section className="panel">
        <p>Loading contest...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <p className="error-text">{error}</p>
      </section>
    );
  }

  if (!contest) {
    return null;
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h1>{contest.name}</h1>
          <p className="muted">{contest.description}</p>
        </div>
        <span className={`badge badge-${contest.accessLevel}`}>
          {contest.accessLevel === 'vip' ? 'VIP Contest' : 'Normal Contest'}
        </span>
      </header>

      <dl className="meta">
        <div>
          <dt>Starts</dt>
          <dd>{formatDateTime(contest.startTime)}</dd>
        </div>
        <div>
          <dt>Ends</dt>
          <dd>{formatDateTime(contest.endTime)}</dd>
        </div>
        {contest.prizeTitle ? (
          <div>
            <dt>Prize</dt>
            <dd>
              <strong>{contest.prizeTitle}</strong>
              {contest.prizeDescription ? ` – ${contest.prizeDescription}` : ''}
            </dd>
          </div>
        ) : null}
        {contest.maxParticipants ? (
          <div>
            <dt>Capacity</dt>
            <dd>{contest.maxParticipants} participants</dd>
          </div>
        ) : null}
      </dl>

      {!user && (
        <p className="info-box">
          You are browsing as a guest. Sign in to join the contest and submit answers.
        </p>
      )}

      {user && !canUserParticipate && (
        <p className="error-text">
          Your current role ({userRoleCode}) does not permit participation in this contest.
        </p>
      )}

      {submissionError && <p className="error-text">{submissionError}</p>}
      {participation && participation.status === 'submitted' && (
        <p className="success-text">
          Submission received! Score {participation.score} / {participation.totalPoints}.
        </p>
      )}

      <div className="actions">
        <button
          type="button"
          className="button"
          onClick={handleJoin}
          disabled={!user || !canUserParticipate}
        >
          {participation ? 'Resume participation' : 'Join contest'}
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={loadLeaderboard}
          disabled={!user}
        >
          View leaderboard
        </button>
      </div>

      <form className="question-form" onSubmit={handleSubmit}>
        <h2>Questions</h2>
        {contest.questions && contest.questions.length ? (
          <ol className="question-list">
            {contest.questions
              .slice()
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((question) => (
                <li key={question.id} className="question-card">
                  <header>
                    <h3>{question.prompt}</h3>
                    <span className="muted">
                      {question.type === 'single' && 'Single choice'}
                      {question.type === 'multi' && 'Multiple choice'}
                      {question.type === 'boolean' && 'True / False'}
                      {` · ${question.points || 1} point${(question.points || 1) > 1 ? 's' : ''}`}
                    </span>
                  </header>
                  <div className="question-inputs">
                    {question.type === 'single' && Array.isArray(question.choices) ? (
                      question.choices.map((choice) => (
                        <label key={choice.value} className="option">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={choice.value}
                            checked={selectedValues(question.id) === choice.value}
                            onChange={() => handleRadioChange(question.id, choice.value)}
                            disabled={!participation || hasSubmitted}
                          />
                          <span>{choice.label || choice.value}</span>
                        </label>
                      ))
                    ) : null}
                    {question.type === 'multi' && Array.isArray(question.choices) ? (
                      question.choices.map((choice) => {
                        const current = Array.isArray(selectedValues(question.id))
                          ? selectedValues(question.id)
                          : [];
                        return (
                          <label key={choice.value} className="option">
                            <input
                              type="checkbox"
                              name={`question-${question.id}`}
                              value={choice.value}
                              checked={current.includes(choice.value)}
                              onChange={() => handleCheckboxToggle(question.id, choice.value)}
                              disabled={!participation || hasSubmitted}
                            />
                            <span>{choice.label || choice.value}</span>
                          </label>
                        );
                      })
                    ) : null}
                    {question.type === 'boolean' ? (
                      <div className="boolean-options">
                        <label className="option">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value="true"
                            checked={selectedValues(question.id) === true}
                            onChange={() => handleBooleanChange(question.id, true)}
                            disabled={!participation || hasSubmitted}
                          />
                          <span>True</span>
                        </label>
                        <label className="option">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value="false"
                            checked={selectedValues(question.id) === false}
                            onChange={() => handleBooleanChange(question.id, false)}
                            disabled={!participation || hasSubmitted}
                          />
                          <span>False</span>
                        </label>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => handleBooleanChange(question.id, undefined)}
                          disabled={!participation || hasSubmitted}
                        >
                          Clear selection
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
          </ol>
        ) : (
          <p>No questions configured for this contest yet.</p>
        )}
        <div className="actions">
          <button
            type="submit"
            className="button button-primary"
            disabled={!participation || hasSubmitted || submitting}
          >
            {hasSubmitted ? 'Submitted' : submitting ? 'Submitting...' : 'Submit answers'}
          </button>
        </div>
      </form>

      {participation && participation.responses && participation.responses.length ? (
        <section className="panel nested">
          <h2>Submission summary</h2>
          <p>
            Score {participation.score} / {participation.totalPoints}
          </p>
          <ul className="response-list">
            {participation.responses.map((response) => (
              <li key={response.questionId}>
                Question #{response.questionId}:{' '}
                {response.correct ? (
                  <span className="success-text">Correct (+{response.awardedPoints})</span>
                ) : (
                  <span className="error-text">Incorrect</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="panel nested">
        <header className="panel-header">
          <h2>Leaderboard</h2>
        </header>
        {leaderboardLoading && <p>Loading leaderboard...</p>}
        {leaderboardError && <p className="error-text">{leaderboardError}</p>}
        {!leaderboardLoading && !leaderboardError && leaderboard.length ? (
          <table className="leaderboard">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Participant</th>
                <th>Score</th>
                <th>Submitted</th>
                <th>Prize</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.participationId}>
                  <td>{entry.rank}</td>
                  <td>{entry.user ? entry.user.username : 'Anonymous'}</td>
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
          !leaderboardLoading && <p>No submissions yet.</p>
        )}
      </section>
    </section>
  );
};

export default ContestDetailPage;
