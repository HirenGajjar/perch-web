import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.ts';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import FeedPage from './pages/FeedPage.tsx';
import ArticlePage from './pages/ArticlePage.tsx';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <FeedPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/library"
        element={
          <PrivateRoute>
            <FeedPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/article/:id"
        element={
          <PrivateRoute>
            <ArticlePage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
