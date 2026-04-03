import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.identifier.trim(), form.password);
      toast.success(`Welcome, ${user.name}!`);
      navigate(user.role === 'farmer' ? '/farmer/dashboard' : '/centre/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Detect if input looks like phone to show correct keyboard on mobile
  const isPhone = /^\d+$/.test(form.identifier.replace(/[\s\-+]/g, ''));

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🐄</div>
          <h1>Jeeva</h1>
          <p className="auth-subtitle">ಜೀವ — Karnataka Govt Livestock AI</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Phone Number or Email</label>
            <input
              type={isPhone ? 'tel' : 'text'}
              inputMode={isPhone ? 'numeric' : 'email'}
              placeholder="Enter phone number or email"
              value={form.identifier}
              onChange={e => setForm({ ...form, identifier: e.target.value })}
              autoComplete="username"
              required
            />
            <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
              e.g. 9876543210 or farmer@example.com
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-link">
          New user? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
