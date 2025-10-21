import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthBackdropLayout from '../components/AuthBackdropLayout';
import './Register.css';
import { API_BASE } from '../api';

export default function Register() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (!res.ok) {
        setError(data?.message || data?.raw || `Registration failed (${res.status})`);
        return;
      }

      if (data?.token) localStorage.setItem('token', data.token);
      if (data?.user)  localStorage.setItem('me', JSON.stringify(data.user));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackdropLayout
      imageUrl="/spotmap-logo.svg"
      duration={36}
      direction="left"
      repeat={true}
      opacity={0.12}
      blur={0}
      overlay={false}
    >
      <div className="hero-card register-card">
        <h1 className="hero-title">Create your account</h1>
        <p className="hero-subtitle">Join SnapMap and start sharing your favorite photo spots.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span>Username</span>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </label>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Submitting…' : 'Register'}
          </button>
        </form>

        <div className="actions-row">
          <Link to="/login" className="btn btn-ghost">Login</Link>
        </div>

        {error && <p className="error-text">{error}</p>}
      </div>
    </AuthBackdropLayout>
  );
}
