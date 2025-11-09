import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ContestListPage from './pages/ContestListPage.jsx';
import ContestDetailPage from './pages/ContestDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AccountHistoryPage from './pages/AccountHistoryPage.jsx';
import AccountInProgressPage from './pages/AccountInProgressPage.jsx';
import AccountPrizesPage from './pages/AccountPrizesPage.jsx';

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Navigate to="/contests" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/contests" element={<ContestListPage />} />
      <Route path="/contests/:id" element={<ContestDetailPage />} />
      <Route
        path="/account/history"
        element={
          <ProtectedRoute>
            <AccountHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/in-progress"
        element={
          <ProtectedRoute>
            <AccountInProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/prizes"
        element={
          <ProtectedRoute>
            <AccountPrizesPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/contests" replace />} />
    </Route>
  </Routes>
);

export default App;
