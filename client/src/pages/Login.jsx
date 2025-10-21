import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthBackdropLayout from '../components/AuthBackdropLayout';
import './Login.css';
import { API_BASE } from '../api';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (!res.ok) {
        setError(data?.message || data?.raw || `Login failed (${res.status})`);
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
      imageUrl="/spotmap-logo.svg"   // 你说的文件名
      duration={36}
      direction="left"
      repeat={true}
      opacity={0.12}                 // 更淡
      blur={0}
      overlay={false}                // 关闭暗遮罩，避免整体太黑
    >
      <div className="hero-card login-card">
        <h1 className="hero-title">Welcome to SnapMap</h1>
        <p className="hero-subtitle">
          Capture and share your best photography moments with the world.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className="actions-row">
          <Link to="/register" className="btn btn-ghost">Register</Link>
        </div>

        {error && <p className="error-text">{error}</p>}
      </div>
    </AuthBackdropLayout>
  );
}
