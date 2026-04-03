import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const KARNATAKA_DISTRICTS = [
  'Bagalkot','Ballari','Belagavi','Bengaluru Rural','Bengaluru Urban','Bidar',
  'Chamarajanagar','Chikkaballapur','Chikkamagaluru','Chitradurga','Dakshina Kannada',
  'Davanagere','Dharwad','Gadag','Hassan','Haveri','Kalaburagi','Kodagu','Kolar',
  'Koppal','Mandya','Mysuru','Raichur','Ramanagara','Shivamogga','Tumakuru',
  'Udupi','Uttara Kannada','Vijayapura','Yadgir'
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('farmer');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    village: '', taluk: '', district: '',
    centreName: '', centreCode: '', licenseNumber: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, role };
      const user = await register(payload);
      toast.success('Registration successful!');
      navigate(user.role === 'farmer' ? '/farmer/dashboard' : '/centre/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="auth-header">
          <div className="auth-logo">🐄</div>
          <h1>Pashimitra</h1>
          <p className="auth-subtitle">ಪಶುಮಿತ್ರ — Register</p>
        </div>

        <div className="role-toggle">
          <button className={role === 'farmer' ? 'active' : ''} onClick={() => setRole('farmer')}>
            👨‍🌾 Farmer
          </button>
          <button className={role === 'ai_centre' ? 'active' : ''} onClick={() => setRole('ai_centre')}>
            🏥 AI Centre
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input placeholder="Mobile number" value={form.phone} onChange={e => set('phone', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="Email address" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>
          </div>

          {role === 'farmer' && (
            <div className="form-row">
              <div className="form-group">
                <label>Village</label>
                <input placeholder="Village name" value={form.village} onChange={e => set('village', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Taluk</label>
                <input placeholder="Taluk" value={form.taluk} onChange={e => set('taluk', e.target.value)} />
              </div>
              <div className="form-group">
                <label>District</label>
                <select value={form.district} onChange={e => set('district', e.target.value)} required>
                  <option value="">Select District</option>
                  {KARNATAKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          )}

          {role === 'ai_centre' && (
            <div className="form-row">
              <div className="form-group">
                <label>Centre Name</label>
                <input placeholder="AI Centre name" value={form.centreName} onChange={e => set('centreName', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Centre Code</label>
                <input placeholder="Govt centre code" value={form.centreCode} onChange={e => set('centreCode', e.target.value)} />
              </div>
              <div className="form-group">
                <label>License Number</label>
                <input placeholder="License number" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">Already registered? <Link to="/login">Login here</Link></p>
      </div>
    </div>
  );
}
