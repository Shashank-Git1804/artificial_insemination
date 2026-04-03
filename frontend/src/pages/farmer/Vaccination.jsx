import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useLang } from '../../context/LanguageContext';

const STORAGE_KEY = 'pashimitra_vaccinations';
const VACCINES = ['FMD (Foot & Mouth)', 'BQ (Black Quarter)', 'HS (Haemorrhagic Septicaemia)',
  'Brucellosis', 'Anthrax', 'Rabies', 'PPR (Goat/Sheep)', 'Swine Fever', 'Deworming'];

function loadVaccinations() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

export default function Vaccination() {
  const { t, lang } = useLang();
  const [animals, setAnimals]   = useState([]);
  const [records, setRecords]   = useState(loadVaccinations());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    animalId: '', vaccine: '', givenDate: new Date().toISOString().split('T')[0],
    nextDueDate: '', notes: '',
  });

  useEffect(() => {
    api.get('/animals').then(r => {
      setAnimals(r.data);
      if (r.data.length > 0) setForm(f => ({ ...f, animalId: r.data[0]._id }));
    });
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    const animal = animals.find(a => a._id === form.animalId);
    const record = {
      id: Date.now(), ...form,
      animalName: animal?.name || animal?.tagId || 'Unknown',
      species: animal?.species,
    };
    const updated = [record, ...records];
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(lang === 'kn' ? 'ಲಸಿಕೆ ದಾಖಲೆ ಸೇರಿಸಲಾಗಿದೆ' : lang === 'hi' ? 'टीका रिकॉर्ड जोड़ा गया' : 'Vaccination record added');
    setShowForm(false);
    setForm(f => ({ ...f, vaccine: '', givenDate: new Date().toISOString().split('T')[0], nextDueDate: '', notes: '' }));
  };

  const today = new Date().toISOString().split('T')[0];
  const overdue = records.filter(r => r.nextDueDate && r.nextDueDate < today);
  const dueSoon = records.filter(r => {
    if (!r.nextDueDate || r.nextDueDate < today) return false;
    const diff = (new Date(r.nextDueDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h2>💉 {t('vaccinationTitle')}</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? t('cancel') : `+ ${t('addVaccination')}`}
        </button>
      </div>

      {/* Alerts */}
      {overdue.length > 0 && (
        <div className="alert-banner danger">
          🚨 {overdue.length} {lang === 'kn' ? 'ಲಸಿಕೆ ಅವಧಿ ಮೀರಿದೆ!' : lang === 'hi' ? 'टीके की तारीख निकल गई!' : 'vaccination(s) overdue!'}
          {overdue.map(r => <span key={r.id} className="alert-tag">{r.animalName} — {r.vaccine}</span>)}
        </div>
      )}
      {dueSoon.length > 0 && (
        <div className="alert-banner warning">
          ⚠️ {dueSoon.length} {lang === 'kn' ? 'ಲಸಿಕೆ ಈ ವಾರ ಬಾಕಿ' : lang === 'hi' ? 'टीका इस हफ्ते बकाया' : 'vaccination(s) due this week'}
        </div>
      )}

      {showForm && (
        <div className="card form-card">
          <h3>{t('addVaccination')}</h3>
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group">
                <label>{lang === 'kn' ? 'ಪ್ರಾಣಿ' : lang === 'hi' ? 'पशु' : 'Animal'} *</label>
                <select value={form.animalId} onChange={e => setForm(f => ({ ...f, animalId: e.target.value }))} required>
                  {animals.map(a => <option key={a._id} value={a._id}>{a.tagId} — {a.name || a.species}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('vaccineName')} *</label>
                <select value={form.vaccine} onChange={e => setForm(f => ({ ...f, vaccine: e.target.value }))} required>
                  <option value="">{lang === 'kn' ? 'ಲಸಿಕೆ ಆಯ್ಕೆ ಮಾಡಿ' : lang === 'hi' ? 'टीका चुनें' : 'Select vaccine'}</option>
                  {VACCINES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('given')} {lang === 'kn' ? 'ದಿನಾಂಕ' : lang === 'hi' ? 'तारीख' : 'Date'}</label>
                <input type="date" value={form.givenDate} onChange={e => setForm(f => ({ ...f, givenDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>{t('dueDate')}</label>
                <input type="date" value={form.nextDueDate} onChange={e => setForm(f => ({ ...f, nextDueDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>{lang === 'kn' ? 'ಟಿಪ್ಪಣಿ' : lang === 'hi' ? 'नोट' : 'Notes'}</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary">{t('save')}</button>
          </form>
        </div>
      )}

      <div className="appointments-list">
        {records.length === 0 && <p className="empty">{lang === 'kn' ? 'ಇನ್ನೂ ದಾಖಲೆ ಇಲ್ಲ' : lang === 'hi' ? 'अभी कोई रिकॉर्ड नहीं' : 'No vaccination records yet'}</p>}
        {records.map(r => {
          const isOverdue = r.nextDueDate && r.nextDueDate < today;
          const diff = r.nextDueDate ? Math.ceil((new Date(r.nextDueDate) - new Date()) / (1000*60*60*24)) : null;
          return (
            <div key={r.id} className="appointment-card">
              <div className="appt-left">
                <div className="appt-farmer-name">🐄 {r.animalName} {r.species && `(${r.species})`}</div>
                <div className="appt-service">💉 {r.vaccine}</div>
                <div className="appt-date">✅ {t('given')}: {r.givenDate}</div>
                {r.nextDueDate && <div className="appt-date" style={{ color: isOverdue ? 'var(--danger)' : diff <= 7 ? 'var(--secondary)' : 'var(--text-muted)' }}>
                  📅 {t('dueDate')}: {r.nextDueDate}
                  {isOverdue ? ` (${lang === 'kn' ? 'ಅವಧಿ ಮೀರಿದೆ' : lang === 'hi' ? 'तारीख निकल गई' : 'OVERDUE'})` :
                   diff !== null ? ` (${diff} ${lang === 'kn' ? 'ದಿನ' : lang === 'hi' ? 'दिन' : 'days'})` : ''}
                </div>}
                {r.notes && <div className="appt-notes">{r.notes}</div>}
              </div>
              <div className="appt-right">
                <span className={`badge ${isOverdue ? 'red' : diff !== null && diff <= 7 ? 'orange' : 'green'}`}>
                  {isOverdue ? t('due') : t('given')}
                </span>
                <button className="btn-danger-sm" onClick={() => {
                  const updated = records.filter(x => x.id !== r.id);
                  setRecords(updated);
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
