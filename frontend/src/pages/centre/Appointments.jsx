import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_COLOR = { pending: 'orange', confirmed: 'blue', completed: 'green', cancelled: 'red' };

const SERVICE_ICON = {
  artificial_insemination: '💉',
  health_checkup: '🩺',
  vaccination: '💊',
  deworming: '🔬',
  semen_extraction: '🧪',
  castration: '✂️',
  gender_checkup: '🩺',
};

export default function CentreAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [updating, setUpdating] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [outcomeForm, setOutcomeForm] = useState({ technicianName: '', outcome: '', notes: '' });

  const fetchAppointments = () =>
    api.get('/appointments').then(r => setAppointments(r.data));

  useEffect(() => { fetchAppointments(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status, ...outcomeForm });
      toast.success(`Appointment marked as ${status}`);
      setUpdating(null);
      setOutcomeForm({ technicianName: '', outcome: '', notes: '' });
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const filtered = appointments.filter(a =>
    filterStatus === 'all' ? true : a.status === filterStatus
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2>📅 Manage Appointments</h2>
        <p>Review and update all livestock service requests</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="filter-tabs">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
          <button key={s} className={`tab ${filterStatus === s ? 'active' : ''}`}
            onClick={() => setFilterStatus(s)}>
            {s === 'all' ? '📋 All' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="tab-count">
              {s === 'all' ? appointments.length : appointments.filter(a => a.status === s).length}
            </span>
          </button>
        ))}
      </div>

      <div className="appointments-list">
        {filtered.length === 0 && (
          <p className="empty">No {filterStatus === 'all' ? '' : filterStatus} appointments found.</p>
        )}
        {filtered.map(a => (
          <div key={a._id} className="appointment-card">
            <div className="appt-left">
              <div className="appt-service-header">
                <span className="appt-service-icon">{SERVICE_ICON[a.serviceType] || '📋'}</span>
                <span className="appt-service-name">{a.serviceType?.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
              <div className="appt-farmer-name">👨🌾 {a.farmer?.name}</div>
              <div className="appt-contact">📞 {a.farmer?.phone} | 📍 {a.farmer?.village}, {a.farmer?.district}</div>
              <div className="appt-animal">
                🐄 {a.animal?.tagId} — {a.animal?.species}
                {a.animal?.breed ? ` (${a.animal.breed})` : ''}
              </div>
              <div className="appt-date">
                📅 {new Date(a.appointmentDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
              {a.notes && <div className="appt-notes">📝 {a.notes}</div>}
              {a.technicianName && <div className="appt-tech">👨⚕️ Technician: {a.technicianName}</div>}
              {a.outcome && <div className="appt-outcome">✅ Outcome: {a.outcome}</div>}
            </div>

            <div className="appt-right">
              <span className={`badge ${STATUS_COLOR[a.status]}`}>{a.status}</span>

              {a.status === 'pending' && (
                <button className="btn-sm blue" onClick={() => updateStatus(a._id, 'confirmed')}>
                  ✅ Confirm
                </button>
              )}

              {a.status === 'confirmed' && (
                <button className="btn-sm green" onClick={() => {
                  setUpdating(a._id);
                  setOutcomeForm({ technicianName: '', outcome: '', notes: '' });
                }}>
                  🏁 Complete
                </button>
              )}

              {(a.status === 'pending' || a.status === 'confirmed') && (
                <button className="btn-danger-sm" onClick={() => updateStatus(a._id, 'cancelled')}>
                  ✕ Cancel
                </button>
              )}
            </div>

            {/* Outcome form shown inline when completing */}
            {updating === a._id && (
              <div className="outcome-form">
                <h4>Complete — {a.serviceType?.replace(/_/g, ' ')}</h4>
                <div className="form-row">
                  <input placeholder="Technician name *" value={outcomeForm.technicianName}
                    onChange={e => setOutcomeForm(f => ({ ...f, technicianName: e.target.value }))} required />
                  <input placeholder={
                    a.serviceType === 'artificial_insemination' ? 'Semen batch no. / bull breed used' :
                    a.serviceType === 'vaccination' ? 'Vaccine name & batch no.' :
                    a.serviceType === 'deworming' ? 'Drug name & dose' :
                    a.serviceType === 'semen_extraction' ? 'Volume collected (ml) / quality' :
                    a.serviceType === 'castration' ? 'Procedure notes' :
                    'Outcome / findings'
                  } value={outcomeForm.outcome}
                    onChange={e => setOutcomeForm(f => ({ ...f, outcome: e.target.value }))} />
                </div>
                <textarea placeholder="Additional notes / follow-up instructions"
                  value={outcomeForm.notes} rows={2}
                  onChange={e => setOutcomeForm(f => ({ ...f, notes: e.target.value }))} />
                <div className="outcome-actions">
                  <button className="btn-primary" onClick={() => updateStatus(a._id, 'completed')}>
                    💾 Save & Complete
                  </button>
                  <button className="btn-secondary" onClick={() => setUpdating(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
