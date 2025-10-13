
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import { API_BASE } from '../api';

function Register() {
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
      console.error('❌ Fetch failed:', err);
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Register'}</button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Register;
