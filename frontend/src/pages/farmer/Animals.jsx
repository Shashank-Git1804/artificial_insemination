import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const SPECIES = ['cow', 'buffalo', 'goat', 'sheep', 'pig'];
const SPECIES_EMOJI = { cow: '🐄', buffalo: '🐃', goat: '🐐', sheep: '🐑', pig: '🐷' };

const BREEDS = {
  cow:     ['HF (Holstein Friesian)', 'Jersey', 'Gir', 'Sahiwal', 'Red Sindhi', 'Deoni', 'Hallikar', 'Amrit Mahal', 'Ongole', 'Tharparkar', 'Kankrej', 'Malnad Gidda'],
  buffalo: ['Murrah', 'Surti', 'Mehsana', 'Jaffarabadi', 'Nili-Ravi', 'Bhadawari', 'Nagpuri', 'Pandharpuri'],
  goat:    ['Beetal', 'Jamnapari', 'Barbari', 'Sirohi', 'Osmanabadi', 'Malabari', 'Surti', 'Sangamneri'],
  sheep:   ['Deccani', 'Bellary', 'Nellore', 'Mandya', 'Hassan', 'Bannur', 'Coimbatore', 'Mecheri'],
  pig:     ['Large White Yorkshire', 'Landrace', 'Duroc', 'Hampshire', 'Ghungroo', 'Desi'],
};

// Ideal weight range (kg) by species and age (years)
const IDEAL_WEIGHT = {
  cow:     { 1: '80–120', 2: '180–250', 3: '280–350', 4: '350–450', 5: '380–500' },
  buffalo: { 1: '100–150', 2: '220–300', 3: '320–420', 4: '400–500', 5: '450–550' },
  goat:    { 1: '10–18', 2: '20–30', 3: '28–40', 4: '32–45', 5: '35–50' },
  sheep:   { 1: '12–20', 2: '22–32', 3: '28–40', 4: '32–45', 5: '35–48' },
  pig:     { 1: '30–60', 2: '80–120', 3: '100–150', 4: '110–160', 5: '120–170' },
};

// First pregnancy age range by species
const PREGNANCY_AGE = {
  cow:     'First heat: 18–24 months. Ideal first pregnancy: 24–30 months.',
  buffalo: 'First heat: 24–30 months. Ideal first pregnancy: 30–36 months.',
  goat:    'First heat: 7–10 months. Ideal first pregnancy: 10–14 months.',
  sheep:   'First heat: 7–9 months. Ideal first pregnancy: 10–12 months.',
  pig:     'First heat: 5–7 months. Ideal first pregnancy: 7–9 months.',
};

function BreedInput({ species, value, onChange }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const suggestions = (BREEDS[species] || []).filter(b =>
    b.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="breed-input-wrap" ref={ref}>
      <input
        placeholder="Type or select breed"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="breed-dropdown">
          {suggestions.map(b => (
            <li key={b} onMouseDown={() => { onChange(b); setQuery(b); setOpen(false); }}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnimalHints({ species, age }) {
  if (!species) return null;
  const ageKey = Math.min(Math.max(Math.round(Number(age)), 1), 5);
  const weightRange = age ? IDEAL_WEIGHT[species]?.[ageKey] : null;
  return (
    <div className="animal-hints">
      {weightRange && (
        <div className="hint-item">⚖️ Ideal weight at {age} yr: <strong>{weightRange} kg</strong></div>
      )}
      <div className="hint-item">🤰 {PREGNANCY_AGE[species]}</div>
    </div>
  );
}

const emptyForm = {
  tagId: '', name: '', species: 'cow', breed: '', age: '', weight: '',
  gender: 'female', pregnancyStatus: 'unknown', notes: ''
};

export default function FarmerAnimals() {
  const [animals, setAnimals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({});
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAnimals = () => api.get('/animals').then(r => setAnimals(r.data));
  useEffect(() => { fetchAnimals(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setEdit = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (image) fd.append('image', image);
      await api.post('/animals', fd);
      toast.success('Animal registered successfully!');
      setForm(emptyForm);
      setImage(null);
      setShowForm(false);
      fetchAnimals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register animal');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (a) => {
    setEditAnimal(a);
    setEditForm({ age: a.age || '', weight: a.weight || '', pregnancyStatus: a.pregnancyStatus || 'unknown', healthStatus: a.healthStatus || 'healthy', notes: a.notes || '' });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => fd.append(k, v));
      await api.put(`/animals/${editAnimal._id}`, fd);
      toast.success('Animal updated!');
      setEditAnimal(null);
      fetchAnimals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this animal?')) return;
    await api.delete(`/animals/${id}`);
    toast.success('Animal removed');
    fetchAnimals();
  };

  // Ideal weight hint for edit modal
  const editAgeKey = Math.min(Math.max(Math.round(Number(editForm.age)), 1), 5);
  const editWeightHint = editAnimal && editForm.age
    ? IDEAL_WEIGHT[editAnimal.species]?.[editAgeKey]
    : null;

  return (
    <div className="page">
      <div className="page-header">
        <h2>🐄 My Animals</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Register Animal'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>Register New Animal</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Tag ID *</label>
                <input placeholder="e.g. KA-MYS-001" value={form.tagId} onChange={e => set('tagId', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input placeholder="Animal name" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Species *</label>
                <select value={form.species} onChange={e => { set('species', e.target.value); set('breed', ''); }}>
                  {SPECIES.map(s => <option key={s} value={s}>{SPECIES_EMOJI[s]} {s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Breed (type or select)</label>
                <BreedInput species={form.species} value={form.breed} onChange={v => set('breed', v)} />
              </div>
              <div className="form-group">
                <label>Age (years)</label>
                <input type="number" min="0" max="30" placeholder="Age" value={form.age} onChange={e => set('age', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" placeholder="Weight" value={form.weight} onChange={e => set('weight', e.target.value)} />
              </div>
            </div>

            {/* Hints box */}
            {(form.age || form.species) && (
              <AnimalHints species={form.species} age={form.age} />
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Gender</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="female">♀️ Female</option>
                  <option value="male">♂️ Male</option>
                </select>
              </div>
              {form.gender === 'female' && (
                <div className="form-group">
                  <label>Pregnancy Status</label>
                  <select value={form.pregnancyStatus} onChange={e => set('pregnancyStatus', e.target.value)}>
                    <option value="unknown">Unknown</option>
                    <option value="open">Open</option>
                    <option value="pregnant">Pregnant</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Photo</label>
                <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea placeholder="Any additional notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register Animal'}
            </button>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editAnimal && (
        <div className="modal-overlay" onClick={() => setEditAnimal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit — {editAnimal.tagId}</h3>
              <button className="modal-close" onClick={() => setEditAnimal(null)}>✕</button>
            </div>
            <div className="modal-readonly-info">
              <span>🏷️ {editAnimal.tagId}</span>
              <span>{SPECIES_EMOJI[editAnimal.species]} {editAnimal.species}</span>
              <span>{editAnimal.gender === 'male' ? '♂️ Male' : '♀️ Female'}</span>
              {editAnimal.breed && <span>🐾 {editAnimal.breed}</span>}
            </div>
            <p className="modal-note">Name, Tag ID, Species, Breed and Gender cannot be changed.</p>
            <form onSubmit={handleEdit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Age (years)</label>
                  <input type="number" min="0" max="30" value={editForm.age} onChange={e => setEdit('age', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Weight (kg) {editWeightHint && <span className="inline-hint">ideal: {editWeightHint} kg</span>}</label>
                  <input type="number" value={editForm.weight} onChange={e => setEdit('weight', e.target.value)} />
                </div>
              </div>
              {editForm.age && <AnimalHints species={editAnimal.species} age={editForm.age} />}
              <div className="form-row">
                <div className="form-group">
                  <label>Health Status</label>
                  <select value={editForm.healthStatus} onChange={e => setEdit('healthStatus', e.target.value)}>
                    <option value="healthy">Healthy</option>
                    <option value="sick">Sick</option>
                    <option value="under_treatment">Under Treatment</option>
                  </select>
                </div>
                {editAnimal.gender === 'female' && (
                  <div className="form-group">
                    <label>Pregnancy Status</label>
                    <select value={editForm.pregnancyStatus} onChange={e => setEdit('pregnancyStatus', e.target.value)}>
                      <option value="unknown">Unknown</option>
                      <option value="open">Open</option>
                      <option value="pregnant">Pregnant</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={editForm.notes} onChange={e => setEdit('notes', e.target.value)} rows={2} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Save Changes</button>
                <button type="button" className="btn-secondary" onClick={() => setEditAnimal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="animals-grid">
        {animals.length === 0 && <p className="empty">No animals registered yet.</p>}
        {animals.map(a => (
          <div key={a._id} className="animal-card">
            <div className="animal-img">
              {a.imageUrl
                ? <img src={`http://localhost:5000${a.imageUrl}`} alt={a.name} />
                : <span className="animal-emoji">{SPECIES_EMOJI[a.species]}</span>}
            </div>
            <div className="animal-gender-badge">{a.gender === 'male' ? '♂️' : '♀️'}</div>
            <div className="animal-info">
              <div className="animal-tag">{a.tagId}</div>
              <div className="animal-name">{a.name || a.species}</div>
              <div className="animal-meta">
                <span>{SPECIES_EMOJI[a.species]} {a.species}</span>
                {a.breed && <span>• {a.breed}</span>}
                {a.age && <span>• {a.age} yrs</span>}
                {a.weight && <span>• {a.weight} kg</span>}
              </div>
              <div className="animal-status">
                <span className={`badge ${a.healthStatus}`}>{a.healthStatus}</span>
                {a.gender === 'female' && <span className={`badge ${a.pregnancyStatus}`}>{a.pregnancyStatus}</span>}
              </div>
            </div>
            <div className="animal-actions">
              <button className="btn-edit-sm" onClick={() => openEdit(a)}>✏️ Edit</button>
              <button className="btn-danger-sm" onClick={() => handleDelete(a._id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
