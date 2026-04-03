import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useLang } from '../../context/LanguageContext';
import { exportReportPDF } from '../../utils/exportUtils';

const SERVICE_ICON = { artificial_insemination:'💉', health_checkup:'🩺', vaccination:'💊', deworming:'🔬', semen_extraction:'🧪', castration:'✂️', gender_checkup:'🩺' };

const emptyRx = { medicine: '', dose: '', duration: '', instructions: '' };

export default function CentreReports() {
  const { lang } = useLang();
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports]           = useState([]);
  const [selected, setSelected]         = useState(null);
  const [viewReport, setViewReport]     = useState(null);
  const [tab, setTab]                   = useState('generate'); // generate | view
  const [form, setForm] = useState({
    technicianName: '', technicianId: '', findings: '', diagnosis: '',
    prescription: [], semenBatchNo: '', bullBreed: '',
    followUpDate: '', followUpNotes: '', serviceCharge: 0,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/appointments').then(r => setAppointments(r.data.filter(a => a.status === 'completed')));
    api.get('/reports').then(r => setReports(r.data)).catch(() => {});
  }, []);

  const L = {
    title:        lang==='kn'?'ವರದಿ ಮತ್ತು ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್':lang==='hi'?'रिपोर्ट और पर्चा':'Reports & Prescriptions',
    generate:     lang==='kn'?'ವರದಿ ರಚಿಸಿ':lang==='hi'?'रिपोर्ट बनाएं':'Generate Report',
    viewAll:      lang==='kn'?'ಎಲ್ಲಾ ವರದಿ':lang==='hi'?'सभी रिपोर्ट':'All Reports',
    selectAppt:   lang==='kn'?'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಆಯ್ಕೆ ಮಾಡಿ':lang==='hi'?'अपॉइंटमेंट चुनें':'Select Appointment',
    technician:   lang==='kn'?'ತಂತ್ರಜ್ಞ ಹೆಸರು':lang==='hi'?'तकनीशियन नाम':'Technician Name',
    techId:       lang==='kn'?'ತಂತ್ರಜ್ಞ ID':lang==='hi'?'तकनीशियन ID':'Technician ID',
    findings:     lang==='kn'?'ತಪಾಸಣೆ ಫಲಿತಾಂಶ':lang==='hi'?'जांच निष्कर्ष':'Examination Findings',
    diagnosis:    lang==='kn'?'ರೋಗ ನಿರ್ಣಯ':lang==='hi'?'निदान':'Diagnosis',
    prescription: lang==='kn'?'ಔಷಧ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ (ಐಚ್ಛಿಕ)':lang==='hi'?'दवा पर्चा (वैकल्पिक)':'Prescription (Optional)',
    addMed:       lang==='kn'?'ಔಷಧ ಸೇರಿಸಿ':lang==='hi'?'दवा जोड़ें':'Add Medicine',
    followUp:     lang==='kn'?'ಮುಂದಿನ ಭೇಟಿ':lang==='hi'?'अगली मुलाकात':'Follow-up Date',
    charge:       lang==='kn'?'ಸೇವಾ ಶುಲ್ಕ (₹)':lang==='hi'?'सेवा शुल्क (₹)':'Service Charge (₹)',
    submit:       lang==='kn'?'ವರದಿ ರಚಿಸಿ ಮತ್ತು PDF ಡೌನ್ಲೋಡ್ ಮಾಡಿ':lang==='hi'?'रिपोर्ट बनाएं और PDF डाउनलोड करें':'Generate Report & Download PDF',
    download:     lang==='kn'?'PDF ಡೌನ್ಲೋಡ್':lang==='hi'?'PDF डाउनलोड':'Download PDF',
    noCompleted:  lang==='kn'?'ಪೂರ್ಣ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಇಲ್ಲ':lang==='hi'?'कोई पूर्ण अपॉइंटमेंट नहीं':'No completed appointments',
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!selected)              e.appt       = lang==='kn'?'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಆಯ್ಕೆ ಮಾಡಿ':lang==='hi'?'अपॉइंटमेंट चुनें':'Select an appointment';
    if (!form.technicianName)   e.tech       = lang==='kn'?'ತಂತ್ರಜ್ಞ ಹೆಸರು ಅಗತ್ಯ':lang==='hi'?'तकनीशियन नाम जरूरी':'Technician name required';
    if (!form.technicianId)     e.techId     = lang==='kn'?'ತಂತ್ರಜ್ಞ ID ಅಗತ್ಯ':lang==='hi'?'तकनीशियन ID जरूरी':'Technician ID required';
    if (!form.findings)         e.findings   = lang==='kn'?'ತಪಾಸಣೆ ಫಲಿತಾಂಶ ಅಗತ್ಯ':lang==='hi'?'जांच निष्कर्ष जरूरी':'Findings required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data: report } = await api.post('/reports', {
        appointmentId: selected._id,
        ...form,
        prescription: form.prescription.filter(p => p.medicine),
      });
      toast.success(lang==='kn'?'ವರದಿ ರಚಿಸಲಾಗಿದೆ!':lang==='hi'?'रिपोर्ट बनाई गई!':'Report generated!');
      exportReportPDF(report, lang);
      setReports(prev => [report, ...prev]);
      setTab('view');
      setSelected(null);
      setForm({ technicianName:'', technicianId:'', findings:'', diagnosis:'', prescription:[], semenBatchNo:'', bullBreed:'', followUpDate:'', followUpNotes:'', serviceCharge:0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const addRx = () => setForm(f => ({ ...f, prescription: [...f.prescription, { ...emptyRx }] }));
  const setRx = (i, k, v) => setForm(f => {
    const rx = [...f.prescription];
    rx[i] = { ...rx[i], [k]: v };
    return { ...f, prescription: rx };
  });
  const removeRx = (i) => setForm(f => ({ ...f, prescription: f.prescription.filter((_, idx) => idx !== i) }));

  return (
    <div className="page">
      <div className="page-header">
        <h2>📋 {L.title}</h2>
        <div className="tab-toggle">
          <button className={tab==='generate'?'active':''} onClick={() => setTab('generate')}>{L.generate}</button>
          <button className={tab==='view'?'active':''} onClick={() => setTab('view')}>{L.viewAll} ({reports.length})</button>
        </div>
      </div>

      {/* ── GENERATE TAB ── */}
      {tab === 'generate' && (
        <form onSubmit={handleSubmit} className="report-form">
          {/* Govt header banner */}
          <div className="report-govt-banner">
            <div className="rgb-left">🏛️</div>
            <div>
              <div className="rgb-title">Government of Karnataka — Pashimitra</div>
              <div className="rgb-sub">Official Animal Health & Service Report Form</div>
            </div>
            <div className="rgb-seal">✅ Govt Validated</div>
          </div>

          {/* Select appointment */}
          <div className="card form-card">
            <h3>1. {L.selectAppt}</h3>
            {errors.appt && <div className="field-error">{errors.appt}</div>}
            <div className="appt-selector">
              {appointments.length === 0 && <p className="empty">{L.noCompleted}</p>}
              {appointments.map(a => (
                <div key={a._id}
                  className={`appt-select-item ${selected?._id === a._id ? 'selected' : ''}`}
                  onClick={() => setSelected(a)}>
                  <span>{SERVICE_ICON[a.serviceType] || '📋'}</span>
                  <div>
                    <div className="asf">{a.farmer?.name} — {a.animal?.tagId} ({a.animal?.species})</div>
                    <div className="ass">{a.serviceType?.replace(/_/g,' ')} | {new Date(a.appointmentDate).toLocaleDateString('en-IN')}</div>
                  </div>
                  {selected?._id === a._id && <span className="check-mark">✅</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Technician details */}
          <div className="card form-card">
            <h3>2. {lang==='kn'?'ತಂತ್ರಜ್ಞ ವಿವರ':lang==='hi'?'तकनीशियन विवरण':'Technician Details'} *</h3>
            <div className="form-row">
              <div className="form-group">
                <label>{L.technician} *</label>
                <input value={form.technicianName} onChange={e => set('technicianName', e.target.value)}
                  placeholder={lang==='kn'?'ತಂತ್ರಜ್ಞ ಹೆಸರು':lang==='hi'?'तकनीशियन नाम':'Full name'} />
                {errors.tech && <div className="field-error">{errors.tech}</div>}
              </div>
              <div className="form-group">
                <label>{L.techId} *</label>
                <input value={form.technicianId} onChange={e => set('technicianId', e.target.value)}
                  placeholder="e.g. KA-VET-2024-001" />
                {errors.techId && <div className="field-error">{errors.techId}</div>}
              </div>
            </div>
            {/* AI service specific */}
            {selected?.serviceType === 'artificial_insemination' && (
              <div className="form-row">
                <div className="form-group">
                  <label>{lang==='kn'?'ವೀರ್ಯ ಬ್ಯಾಚ್ ನಂ.':lang==='hi'?'वीर्य बैच नं.':'Semen Batch No.'}</label>
                  <input value={form.semenBatchNo} onChange={e => set('semenBatchNo', e.target.value)} placeholder="e.g. NDDB-2025-HF-001" />
                </div>
                <div className="form-group">
                  <label>{lang==='kn'?'ಹೋರಿ ತಳಿ':lang==='hi'?'बैल नस्ल':'Bull Breed'}</label>
                  <input value={form.bullBreed} onChange={e => set('bullBreed', e.target.value)} placeholder="e.g. HF, Jersey, Gir" />
                </div>
              </div>
            )}
          </div>

          {/* Findings & Diagnosis */}
          <div className="card form-card">
            <h3>3. {L.findings} & {L.diagnosis} *</h3>
            <div className="form-group">
              <label>{L.findings} *</label>
              <textarea rows={3} value={form.findings} onChange={e => set('findings', e.target.value)}
                placeholder={lang==='kn'?'ತಪಾಸಣೆ ಸಮಯ ಕಂಡ ವಿಷಯಗಳು...':lang==='hi'?'जांच के दौरान पाई गई बातें...':'Describe examination findings...'} />
              {errors.findings && <div className="field-error">{errors.findings}</div>}
            </div>
            <div className="form-group">
              <label>{L.diagnosis}</label>
              <textarea rows={2} value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)}
                placeholder={lang==='kn'?'ರೋಗ ನಿರ್ಣಯ...':lang==='hi'?'निदान...':'Diagnosis / conclusion...'} />
            </div>
          </div>

          {/* Prescription */}
          <div className="card form-card">
            <div className="form-card-header">
              <h3>4. {L.prescription}</h3>
              <button type="button" className="btn-sm blue" onClick={addRx}>+ {L.addMed}</button>
            </div>
            {form.prescription.map((rx, i) => (
              <div key={i} className="rx-row">
                <div className="rx-num">{i+1}</div>
                <input placeholder={lang==='kn'?'ಔಷಧ ಹೆಸರು':lang==='hi'?'दवा नाम':'Medicine name'} value={rx.medicine} onChange={e => setRx(i,'medicine',e.target.value)} />
                <input placeholder={lang==='kn'?'ಡೋಸ್':lang==='hi'?'खुराक':'Dose'} value={rx.dose} onChange={e => setRx(i,'dose',e.target.value)} style={{width:'80px'}} />
                <input placeholder={lang==='kn'?'ಅವಧಿ':lang==='hi'?'अवधि':'Duration'} value={rx.duration} onChange={e => setRx(i,'duration',e.target.value)} style={{width:'80px'}} />
                <input placeholder={lang==='kn'?'ಸೂಚನೆ':lang==='hi'?'निर्देश':'Instructions'} value={rx.instructions} onChange={e => setRx(i,'instructions',e.target.value)} />
                <button type="button" className="btn-danger-sm" onClick={() => removeRx(i)}>✕</button>
              </div>
            ))}
            {form.prescription.length === 0 && <p className="empty" style={{fontSize:'12px'}}>{lang==='kn'?'ಔಷಧ ಇಲ್ಲ — ಐಚ್ಛಿಕ':lang==='hi'?'कोई दवा नहीं — वैकल्पिक':'No medicines — optional'}</p>}
          </div>

          {/* Follow-up & Charge */}
          <div className="card form-card">
            <h3>5. {lang==='kn'?'ಮುಂದಿನ ಭೇಟಿ ಮತ್ತು ಶುಲ್ಕ':lang==='hi'?'अगली मुलाकात और शुल्क':'Follow-up & Charges'}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>{L.followUp}</label>
                <input type="date" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{L.charge}</label>
                <input type="number" min="0" value={form.serviceCharge} onChange={e => set('serviceCharge', parseFloat(e.target.value)||0)} placeholder="0" />
              </div>
            </div>
            <div className="form-group">
              <label>{lang==='kn'?'ಮುಂದಿನ ಭೇಟಿ ಸೂಚನೆ':lang==='hi'?'अगली मुलाकात निर्देश':'Follow-up notes'}</label>
              <textarea rows={2} value={form.followUpNotes} onChange={e => set('followUpNotes', e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn-primary full-width" disabled={loading} style={{fontSize:'15px',padding:'14px'}}>
            {loading ? (lang==='kn'?'ರಚಿಸಲಾಗುತ್ತಿದೆ...':lang==='hi'?'बन रहा है...':'Generating...') : `📄 ${L.submit}`}
          </button>
        </form>
      )}

      {/* ── VIEW TAB ── */}
      {tab === 'view' && (
        <div className="appointments-list">
          {reports.length === 0 && <p className="empty">{lang==='kn'?'ಇನ್ನೂ ವರದಿ ಇಲ್ಲ':lang==='hi'?'अभी कोई रिपोर्ट नहीं':'No reports yet'}</p>}
          {reports.map(r => (
            <div key={r._id} className="appointment-card">
              <div className="appt-left">
                <div className="appt-farmer-name">📋 {r.reportNumber}</div>
                <div className="appt-animal">🐄 {r.animal?.tagId} — {r.animal?.species}</div>
                <div className="appt-contact">👨🌾 {r.farmer?.name} | 📞 {r.farmer?.phone}</div>
                <div className="appt-service">{r.serviceType?.replace(/_/g,' ')}</div>
                <div className="appt-date">📅 {new Date(r.issuedAt).toLocaleDateString('en-IN')}</div>
              </div>
              <div className="appt-right">
                <span className={`badge ${r.paymentStatus==='paid'?'green':r.paymentStatus==='pending'?'orange':'blue'}`}>
                  {r.paymentStatus}
                </span>
                <button className="btn-sm green" onClick={() => exportReportPDF(r, lang)}>
                  📄 {L.download}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
