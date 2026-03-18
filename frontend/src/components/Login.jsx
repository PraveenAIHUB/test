/**
 * Login — professional single-viewport layout
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    if (result.success) navigate('/');
    else setError(result.error);
    setLoading(false);
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    const creds = { admin: ['admin', 'admin123'], manager: ['manager', 'manager123'], user: ['user', 'user123'] };
    const [u, p] = creds[role] || [];
    const result = await login(u, p);
    if (result.success) navigate('/');
    else setError(result.error);
    setLoading(false);
  };

  return (
    <div className="login">
      <div className="login__panel login__hero">
        <div className="login__hero-bg" aria-hidden>
          <div className="login__hero-shape login__hero-shape--1"/>
          <div className="login__hero-shape login__hero-shape--2"/>
          <div className="login__hero-shape login__hero-shape--3"/>
          <div className="login__hero-grid"/>
        </div>
        <div className="login__hero-inner">
          <div className="login__logo" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1 className="login__brand">Property Pro</h1>
          <p className="login__tagline">Property & facility management in one place</p>
          <div className="login__feature-cards">
            <div className="login__feature-card">
              <span className="login__feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </span>
              <span className="login__feature-text">Properties & Leases</span>
            </div>
            <div className="login__feature-card">
              <span className="login__feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </span>
              <span className="login__feature-text">Analytics & Reports</span>
            </div>
            <div className="login__feature-card">
              <span className="login__feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </span>
              <span className="login__feature-text">Security & Compliance</span>
            </div>
          </div>
          <p className="login__hero-footer">One platform for your entire portfolio</p>
        </div>
      </div>

      <div className="login__panel login__form-panel">
        <div className="login__form-wrap">
          <header className="login__form-header">
            <h2 className="login__form-title">Welcome back</h2>
            <p className="login__form-subtitle">Sign in to your account</p>
          </header>

          {error && (
            <div className="login__error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18"><circle cx="12" cy="12" r="10" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login__form">
            <label className="login__label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="login__input"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
            />
            <label className="login__label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="login__input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <button type="submit" className="login__submit" disabled={loading} aria-busy={loading}>
              {loading && <span className="login__submit-spinner" aria-hidden/>}
              <span className="login__submit-text">{loading ? 'Signing in…' : 'Sign in'}</span>
            </button>
          </form>

          <div className="login__demo">
            <span className="login__demo-label">Demo accounts</span>
            <div className="login__demo-btns">
              <button type="button" className="login__demo-btn" onClick={() => handleDemoLogin('admin')} disabled={loading}>Admin</button>
              <button type="button" className="login__demo-btn" onClick={() => handleDemoLogin('manager')} disabled={loading}>Manager</button>
              <button type="button" className="login__demo-btn" onClick={() => handleDemoLogin('user')} disabled={loading}>User</button>
            </div>
            <p className="login__demo-hint">admin / admin123 · manager / manager123 · user / user123</p>
          </div>

          <footer className="login__form-footer">
            <span className="login__form-footer-brand">Property Pro</span>
            <span className="login__form-footer-sep">·</span>
            <span className="login__form-footer-copy">Secure sign-in</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Login;
