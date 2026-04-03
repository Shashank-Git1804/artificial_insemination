import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useLang } from '../../context/LanguageContext';

const STORAGE_KEY = 'pashimitra_milk_records';

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export default function MilkTracker() {
  const { t, lang } = useLang();
  const [animals, setAnimals] = useState([]);
  const [records, setRecords] = useState(loadRecords());
  const [form, setForm] = useState({ animalId: '', date: new Date().toISOString().split('T')[0], morning: '', evening: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/animals').then(r => {
      const cows = r.data.filter(a => a.gender === 'female' && ['cow','buffalo'].includes(a.species));
      setAnimals(cows);
      if (cows.length > 0) setForm(f => ({ ...f, animalId: cows[0]._id }));
    });
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    const morning = parseFloat(form.morning) || 0;
    const evening = parseFloat(form.evening) || 0;
    const animal  = animals.find(a => a._id === form.animalId);
    const record  = {
      id: Date.now(), animalId: form.animalId,
      animalName: animal?.name || animal?.tagId || 'Unknown',
      date: form.date, morning, evening, total: morning + evening,
    };
    const updated = [record, ...records].slice(0, 200);
    setRecords(updated);
    saveRecords(updated);
    toast.success(lang === 'kn' ? 'ಹಾಲು ದಾಖಲೆ ಸೇರಿಸಲಾಗಿದೆ' : lang === 'hi' ? 'दूध रिकॉर्ड जोड़ा गया' : 'Milk record added');
    setShowForm(false);
    setForm(f => ({ ...f, morning: '', evening: '' }));
  };

  const deleteRecord = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveRecords(updated);
  };

  // Chart data — last 7 days
  const last7 = [...records].slice(0, 7).reverse();

  // Stats
  const todayRecords = records.filter(r => r.date === new Date().toISOString().split('T')[0]);
  const todayTotal   = todayRecords.reduce((s, r) => s + r.total, 0);
  const weekTotal    = records.slice(0, 7).reduce((s, r) => s + r.total, 0);
  const avgDaily     = records.length > 0 ? (records.slice(0, 30).reduce((s, r) => s + r.total, 0) / Math.min(records.length, 30)).toFixed(1) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h2>🥛 {t('milkTrackerTitle')}</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? t('cancel') : `+ ${t('addRecord')}`}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">🥛</div>
          <div className="stat-value">{todayTotal.toFixed(1)}L</div>
          <div className="stat-label">{lang === 'kn' ? 'ಇಂದಿನ ಹಾಲು' : lang === 'hi' ? 'आज का दूध' : "Today's Milk"}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{weekTotal.toFixed(1)}L</div>
          <div className="stat-label">{lang === 'kn' ? 'ಈ ವಾರ' : lang === 'hi' ? 'इस हफ्ते' : 'This Week'}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{avgDaily}L</div>
          <div className="stat-label">{lang === 'kn' ? 'ದೈನಂದಿನ ಸರಾಸರಿ' : lang === 'hi' ? 'दैनिक औसत' : 'Daily Average'}</div>
        </div>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>{t('addRecord')}</h3>
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group">
                <label>{lang === 'kn' ? 'ಪ್ರಾಣಿ' : lang === 'hi' ? 'पशु' : 'Animal'}</label>
                <select value={form.animalId} onChange={e => setForm(f => ({ ...f, animalId: e.target.value }))}>
                  {animals.map(a => <option key={a._id} value={a._id}>{a.tagId} — {a.name || a.species}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{lang === 'kn' ? 'ದಿನಾಂಕ' : lang === 'hi' ? 'तारीख' : 'Date'}</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>🌅 {t('morning')} (L)</label>
                <input type="number" step="0.1" min="0" placeholder="0.0" value={form.morning}
                  onChange={e => setForm(f => ({ ...f, morning: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>🌆 {t('evening')} (L)</label>
                <input type="number" step="0.1" min="0" placeholder="0.0" value={form.evening}
                  onChange={e => setForm(f => ({ ...f, evening: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>{t('totalLitres')}</label>
                <input readOnly value={((parseFloat(form.morning)||0)+(parseFloat(form.evening)||0)).toFixed(1) + ' L'}
                  style={{ background: 'var(--primary-light)', fontWeight: 700 }} />
              </div>
            </div>
            <button type="submit" className="btn-primary">{t('save')}</button>
          </form>
        </div>
      )}

      {last7.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>{lang === 'kn' ? 'ಕಳೆದ 7 ದಿನಗಳ ಹಾಲು' : lang === 'hi' ? 'पिछले 7 दिनों का दूध' : 'Last 7 Days Milk Yield'}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}L`, 'Total']} />
              <Bar dataKey="total" fill="var(--primary)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="appointments-list">
        {records.length === 0 && <p className="empty">{lang === 'kn' ? 'ಇನ್ನೂ ದಾಖಲೆ ಇಲ್ಲ' : lang === 'hi' ? 'अभी कोई रिकॉर्ड नहीं' : 'No records yet'}</p>}
        {records.map(r => (
          <div key={r.id} className="appointment-card">
            <div className="appt-left">
              <div className="appt-farmer-name">🐄 {r.animalName}</div>
              <div className="appt-date">📅 {r.date}</div>
              <div className="appt-service">
                🌅 {t('morning')}: {r.morning}L &nbsp;|&nbsp; 🌆 {t('evening')}: {r.evening}L
              </div>
            </div>
            <div className="appt-right">
              <span className="badge green">{r.total.toFixed(1)} L</span>
              <button className="btn-danger-sm" onClick={() => deleteRecord(r.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
