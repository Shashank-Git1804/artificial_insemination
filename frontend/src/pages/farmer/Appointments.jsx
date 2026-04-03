import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_COLOR = { pending: 'orange', confirmed: 'blue', completed: 'green', cancelled: 'red' };

const FEMALE_SERVICES = [
  { value: 'artificial_insemination', label: '💉 Artificial Insemination' },
  { value: 'health_checkup', label: '🩺 Health Checkup' },
  { value: 'vaccination', label: '💊 Vaccination' },
  { value: 'deworming', label: '🔬 Deworming' },
];

const MALE_SERVICES = [
  { value: 'gender_checkup', label: '🩺 General Health Checkup' },
  { value: 'semen_extraction', label: '🧪 Semen Extraction' },
  { value: 'castration', label: '✂️ Castration' },
  { value: 'vaccination', label: '💊 Vaccination' },
  { value: 'deworming', label: '🔬 Deworming' },
];

export default function FarmerAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [form, setForm] = useState({
    animalId: '', appointmentDate: '', serviceType: '', notes: ''
  });

  const fetchAll = () => Promise.all([
    api.get('/appointments').then(r => setAppointments(r.data)),
    api.get('/animals').then(r => setAnimals(r.data)),
  ]);

  useEffect(() => { fetchAll(); }, []);

  const handleAnimalChange = (id) => {
    const animal = animals.find(a => a._id === id);
    setSelectedAnimal(animal || null);
    const defaultService = animal?.gender === 'male' ? 'gender_checkup' : 'artificial_insemination';
    setForm(f => ({ ...f, animalId: id, serviceType: defaultService }));
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const services = selectedAnimal?.gender === 'male' ? MALE_SERVICES : FEMALE_SERVICES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', {
        animal: form.animalId,
        appointmentDate: form.appointmentDate,
        serviceType: form.serviceType,
        notes: form.notes
      });
      toast.success('Appointment booked!');
      setShowForm(false);
      setSelectedAnimal(null);
      setForm({ animalId: '', appointmentDate: '', serviceType: '', notes: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    await api.delete(`/appointments/${id}`);
    toast.success('Appointment cancelled');
    fetchAll();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>📅 Appointments</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Book Appointment'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>Book New Appointment</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Animal *</label>
                <select value={form.animalId} onChange={e => handleAnimalChange(e.target.value)} required>
                  <option value="">Select animal</option>
                  {animals.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.tagId} — {a.name || a.species} ({a.gender === 'male' ? '♂️ Male' : '♀️ Female'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Service Type *</label>
                <select value={form.serviceType} onChange={e => set('serviceType', e.target.value)} required disabled={!selectedAnimal}>
                  <option value="">Select service</option>
                  {services.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {selectedAnimal && (
                  <span className="field-hint">
                    {selectedAnimal.gender === 'male' ? '♂️ Male animal services' : '♀️ Female animal services'}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>Preferred Date *</label>
                <input type="datetime-local" value={form.appointmentDate}
                  onChange={e => set('appointmentDate', e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea placeholder="Any special notes for the technician"
                value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
            </div>
            <button type="submit" className="btn-primary">Book Appointment</button>
          </form>
        </div>
      )}

      <div className="appointments-list">
        {appointments.length === 0 && <p className="empty">No appointments yet.</p>}
        {appointments.map(a => (
          <div key={a._id} className="appointment-card">
            <div className="appt-left">
              <div className="appt-date">
                📅 {new Date(a.appointmentDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
              <div className="appt-animal">
                {a.animal?.tagId} — {a.animal?.species}
              </div>
              <div className="appt-service">{a.serviceType?.replace(/_/g, ' ')}</div>
              {a.notes && <div className="appt-notes">📝 {a.notes}</div>}
              {a.technicianName && <div className="appt-tech">👨‍⚕️ {a.technicianName}</div>}
              {a.outcome && <div className="appt-outcome">✅ {a.outcome}</div>}
            </div>
            <div className="appt-right">
              <span className={`badge ${STATUS_COLOR[a.status]}`}>{a.status}</span>
              {a.status === 'pending' && (
                <button className="btn-danger-sm" onClick={() => handleCancel(a._id)}>Cancel</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
