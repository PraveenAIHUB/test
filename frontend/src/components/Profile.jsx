import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/Profile.css';

function Profile() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const displayName = user.full_name || user.username;
  const roleLabel = (user.role || 'USER').replace(/_/g, ' ');

  return (
    <div className="profile-page">
      <div className="profile-page__inner">
        <header className="profile-page__header">
          <h1 className="profile-page__title">My Profile</h1>
          <p className="profile-page__subtitle">View and manage your account information</p>
        </header>

        <div className="profile-page__card">
          <div className="profile-page__avatar">
            <span className="profile-page__avatar-text">
              {(displayName || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="profile-page__name">{displayName}</h2>
          <div className="profile-page__role-badge">{roleLabel}</div>

          <dl className="profile-page__details">
            <div className="profile-page__detail-row">
              <dt>Username</dt>
              <dd>{user.username || '—'}</dd>
            </div>
            <div className="profile-page__detail-row">
              <dt>Email</dt>
              <dd>{user.email || '—'}</dd>
            </div>
            <div className="profile-page__detail-row">
              <dt>Role</dt>
              <dd>{roleLabel}</dd>
            </div>
            {user.user_id && (
              <div className="profile-page__detail-row">
                <dt>User ID</dt>
                <dd>{user.user_id}</dd>
              </div>
            )}
          </dl>

          <div className="profile-page__actions">
            <Link to="/" className="profile-page__btn profile-page__btn--primary">
              Back to Dashboard
            </Link>
            <button
              type="button"
              className="profile-page__btn profile-page__btn--secondary"
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
