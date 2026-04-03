import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';

const CENTRE_CIRCULARS = {
  en: [
    { id:1, icon:'📋', tag:'Protocol Update', title:'Updated AI Protocol — KSBB 2025',
      body:'Karnataka State Bioresource Board has updated semen handling protocols. All technicians must use liquid nitrogen containers below -196°C. Thaw at 35-37°C for 30 seconds.',
      date:'Jan 2025', color:'#e8f5e9', border:'#2e7d32' },
    { id:2, icon:'🧪', tag:'Semen Quality', title:'New Semen Quality Standards',
      body:'Minimum motility threshold raised to 60% post-thaw. Reject straws below this threshold. Report quality issues to KSBB within 24 hours.',
      date:'Feb 2025', color:'#e3f2fd', border:'#1565c0' },
    { id:3, icon:'📊', tag:'Target', title:'Q1 2025 AI Target — Karnataka',
      body:'State target: 8 lakh AI services by March 2025. Each centre must achieve minimum 200 AI/month. Submit monthly reports via Pashimitra portal.',
      date:'Mar 2025', color:'#fff8e1', border:'#f57f17' },
    { id:4, icon:'🏆', tag:'Incentive', title:'Performance Incentive Scheme',
      body:'Centres achieving >70% conception rate eligible for ₹25,000 annual incentive. Data tracked via Pashimitra. Ensure all outcomes are recorded.',
      date:'Apr 2025', color:'#f3e5f5', border:'#6a1b9a' },
    { id:5, icon:'⚠️', tag:'Disease Alert', title:'Lumpy Skin Disease — High Alert',
      body:'LSD outbreak reported in Belagavi & Dharwad districts. Suspend AI in affected areas. Vaccinate all cattle within 5km radius of outbreak.',
      date:'May 2025', color:'#ffebee', border:'#c62828' },
  ],
  kn: [
    { id:1, icon:'📋', tag:'ಪ್ರೋಟೋಕಾಲ್ ಅಪ್ಡೇಟ್', title:'ಅಪ್ಡೇಟ್ AI ಪ್ರೋಟೋಕಾಲ್ — KSBB 2025',
      body:'KSBB ವೀರ್ಯ ನಿರ್ವಹಣೆ ಪ್ರೋಟೋಕಾಲ್ ಅಪ್ಡೇಟ್ ಮಾಡಿದೆ. ಎಲ್ಲಾ ತಂತ್ರಜ್ಞರು -196°C ಕೆಳಗೆ ದ್ರವ ಸಾರಜನಕ ಕಂಟೇನರ್ ಬಳಸಬೇಕು.',
      date:'ಜನ 2025', color:'#e8f5e9', border:'#2e7d32' },
    { id:2, icon:'🧪', tag:'ವೀರ್ಯ ಗುಣಮಟ್ಟ', title:'ಹೊಸ ವೀರ್ಯ ಗುಣಮಟ್ಟ ಮಾನದಂಡ',
      body:'ಕರಗಿದ ನಂತರ ಕನಿಷ್ಠ ಚಲನಶೀಲತೆ 60%ಕ್ಕೆ ಹೆಚ್ಚಿಸಲಾಗಿದೆ. ಈ ಮಿತಿಗಿಂತ ಕಡಿಮೆ ಇರುವ ಸ್ಟ್ರಾಗಳನ್ನು ತಿರಸ್ಕರಿಸಿ.',
      date:'ಫೆಬ್ 2025', color:'#e3f2fd', border:'#1565c0' },
    { id:3, icon:'📊', tag:'ಗುರಿ', title:'Q1 2025 AI ಗುರಿ — ಕರ್ನಾಟಕ',
      body:'ರಾಜ್ಯ ಗುರಿ: ಮಾರ್ಚ್ 2025 ರ ವೇಳೆಗೆ 8 ಲಕ್ಷ AI ಸೇವೆಗಳು. ಪ್ರತಿ ಕೇಂದ್ರ ತಿಂಗಳಿಗೆ ಕನಿಷ್ಠ 200 AI ಸಾಧಿಸಬೇಕು.',
      date:'ಮಾರ್ 2025', color:'#fff8e1', border:'#f57f17' },
    { id:4, icon:'🏆', tag:'ಪ್ರೋತ್ಸಾಹ', title:'ಕಾರ್ಯಕ್ಷಮತೆ ಪ್ರೋತ್ಸಾಹ ಯೋಜನೆ',
      body:'70%ಕ್ಕಿಂತ ಹೆಚ್ಚು ಗರ್ಭಧಾರಣೆ ದರ ಸಾಧಿಸಿದ ಕೇಂದ್ರಗಳಿಗೆ ₹25,000 ವಾರ್ಷಿಕ ಪ್ರೋತ್ಸಾಹ.',
      date:'ಏಪ್ರಿ 2025', color:'#f3e5f5', border:'#6a1b9a' },
    { id:5, icon:'⚠️', tag:'ರೋಗ ಎಚ್ಚರಿಕೆ', title:'ಗಂಟು ಚರ್ಮ ರೋಗ — ಹೆಚ್ಚಿನ ಎಚ್ಚರಿಕೆ',
      body:'ಬೆಳಗಾವಿ ಮತ್ತು ಧಾರವಾಡ ಜಿಲ್ಲೆಗಳಲ್ಲಿ LSD ಪ್ರಕೋಪ. ಪ್ರಭಾವಿತ ಪ್ರದೇಶಗಳಲ್ಲಿ AI ಅಮಾನತು ಮಾಡಿ.',
      date:'ಮೇ 2025', color:'#ffebee', border:'#c62828' },
  ],
  hi: [
    { id:1, icon:'📋', tag:'प्रोटोकॉल अपडेट', title:'अपडेटेड AI प्रोटोकॉल — KSBB 2025',
      body:'KSBB ने वीर्य संचालन प्रोटोकॉल अपडेट किया है। सभी तकनीशियनों को -196°C से नीचे तरल नाइट्रोजन कंटेनर का उपयोग करना होगा।',
      date:'जन 2025', color:'#e8f5e9', border:'#2e7d32' },
    { id:2, icon:'🧪', tag:'वीर्य गुणवत्ता', title:'नए वीर्य गुणवत्ता मानक',
      body:'पिघलने के बाद न्यूनतम गतिशीलता 60% तक बढ़ाई गई। इस सीमा से कम स्ट्रॉ को अस्वीकार करें।',
      date:'फर 2025', color:'#e3f2fd', border:'#1565c0' },
    { id:3, icon:'📊', tag:'लक्ष्य', title:'Q1 2025 AI लक्ष्य — कर्नाटक',
      body:'राज्य लक्ष्य: मार्च 2025 तक 8 लाख AI सेवाएं। प्रत्येक केंद्र को प्रति माह न्यूनतम 200 AI करना होगा।',
      date:'मार 2025', color:'#fff8e1', border:'#f57f17' },
    { id:4, icon:'🏆', tag:'प्रोत्साहन', title:'प्रदर्शन प्रोत्साहन योजना',
      body:'70% से अधिक गर्भाधान दर प्राप्त करने वाले केंद्रों को ₹25,000 वार्षिक प्रोत्साहन।',
      date:'अप्र 2025', color:'#f3e5f5', border:'#6a1b9a' },
    { id:5, icon:'⚠️', tag:'रोग चेतावनी', title:'गांठदार त्वचा रोग — उच्च सतर्कता',
      body:'बेलगावी और धारवाड़ जिलों में LSD प्रकोप। प्रभावित क्षेत्रों में AI निलंबित करें।',
      date:'मई 2025', color:'#ffebee', border:'#c62828' },
  ],
};

function Carousel({ items }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const next = () => setIdx(i => (i + 1) % items.length);
  const prev = () => setIdx(i => (i - 1 + items.length) % items.length);
  useEffect(() => {
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [items]);
  const item = items[idx];
  return (
    <div className="carousel" style={{ borderLeft:`4px solid ${item.border}`, background:item.color }}>
      <div className="carousel-content">
        <div className="carousel-top">
          <span className="carousel-icon">{item.icon}</span>
          <span className="carousel-tag" style={{ color:item.border }}>{item.tag}</span>
          <span className="carousel-date">{item.date}</span>
        </div>
        <div className="carousel-title">{item.title}</div>
        <div className="carousel-body">{item.body}</div>
      </div>
      <div className="carousel-controls">
        <button onClick={prev}>‹</button>
        <div className="carousel-dots">
          {items.map((_, i) => (
            <span key={i} className={`dot ${i===idx?'active':''}`}
              style={{ background: i===idx ? item.border : '#ccc' }}
              onClick={() => setIdx(i)} />
          ))}
        </div>
        <button onClick={next}>›</button>
      </div>
    </div>
  );
}

export default function CentreDashboard() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <div className="loading">{t('loading')}</div>;

  const circulars = CENTRE_CIRCULARS[lang] || CENTRE_CIRCULARS.en;

  const L = {
    title:        lang==='kn'?'ಡ್ಯಾಶ್ಬೋರ್ಡ್':lang==='hi'?'डैशबोर्ड':'Dashboard',
    circulars:    lang==='kn'?'KSBB ಸುತ್ತೋಲೆ ಮತ್ತು ತಾಂತ್ರಿಕ ಅಪ್ಡೇಟ್':lang==='hi'?'KSBB परिपत्र और तकनीकी अपडेट':'KSBB Circulars & Technical Updates',
    farmers:      lang==='kn'?'ನೋಂದಾಯಿತ ರೈತರು':lang==='hi'?'पंजीकृत किसान':'Registered Farmers',
    pending:      lang==='kn'?'ಬಾಕಿ ಅಪಾಯಿಂಟ್ಮೆಂಟ್':lang==='hi'?'बकाया अपॉइंटमेंट':'Pending Appointments',
    completed:    lang==='kn'?'ಪೂರ್ಣ ಸೇವೆಗಳು':lang==='hi'?'पूर्ण सेवाएं':'Completed Services',
    animals:      lang==='kn'?'ಒಟ್ಟು ಪ್ರಾಣಿಗಳು':lang==='hi'?'कुल पशु':'Total Animals',
    heatAlerts:   lang==='kn'?'ಇತ್ತೀಚಿನ ಗರ್ಭಧಾರಣೆ ಎಚ್ಚರಿಕೆ':lang==='hi'?'हाल की गर्मी चेतावनी':'Recent Heat Alerts',
    recentAppts:  lang==='kn'?'ಇತ್ತೀಚಿನ ಅಪಾಯಿಂಟ್ಮೆಂಟ್':lang==='hi'?'हाल के अपॉइंटमेंट':'Recent Appointments',
    noAlerts:     lang==='kn'?'ಈ ಸಮಯದಲ್ಲಿ ಯಾವುದೇ ಎಚ್ಚರಿಕೆ ಇಲ್ಲ':lang==='hi'?'अभी कोई चेतावनी नहीं':'No heat alerts at this time.',
    noAppts:      lang==='kn'?'ಇತ್ತೀಚಿನ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಇಲ್ಲ':lang==='hi'?'हाल के अपॉइंटमेंट नहीं':'No recent appointments.',
    heatDetected: lang==='kn'?'ಗರ್ಭಧಾರಣೆ ಪತ್ತೆ':lang==='hi'?'गर्मी पहचानी':'Heat Detected',
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>🏥 {user?.centreName || 'AI Centre'} {L.title}</h2>
        <p>Karnataka Govt — Pashimitra AI Insemination Centre</p>
      </div>

      <div className="section-label">📋 {L.circulars}</div>
      <Carousel items={circulars} />

      <div className="stats-grid" style={{ marginTop:'24px' }}>
        <div className="stat-card blue"><div className="stat-icon">👨🌾</div><div className="stat-value">{data.totalFarmers}</div><div className="stat-label">{L.farmers}</div></div>
        <div className="stat-card orange"><div className="stat-icon">📅</div><div className="stat-value">{data.pendingAppointments}</div><div className="stat-label">{L.pending}</div></div>
        <div className="stat-card green"><div className="stat-icon">✅</div><div className="stat-value">{data.completedAppointments}</div><div className="stat-label">{L.completed}</div></div>
        <div className="stat-card purple"><div className="stat-icon">🐄</div><div className="stat-value">{data.totalAnimals}</div><div className="stat-label">{L.animals}</div></div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>🚨 {L.heatAlerts}</h3>
          {data.heatAlerts?.length > 0 ? (
            <div className="alert-list">
              {data.heatAlerts.map(p => (
                <div key={p._id} className="alert-item positive">
                  <div className="alert-info">
                    <span className="alert-animal">{p.animal?.species} — {p.animal?.tagId}</span>
                    <span className="alert-farmer">👨🌾 {p.farmer?.name} | 📞 {p.farmer?.phone}</span>
                    <span className="alert-location">📍 {p.farmer?.village}</span>
                  </div>
                  <div className="alert-meta">
                    <span className="badge red">{L.heatDetected}</span>
                    <span className="alert-time">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="empty">{L.noAlerts}</p>}
        </div>

        <div className="card">
          <h3>📅 {L.recentAppts}</h3>
          {data.recentAppointments?.length > 0 ? (
            <div className="appointment-list">
              {data.recentAppointments.map(a => (
                <div key={a._id} className="appointment-item">
                  <div>
                    <div className="appt-farmer">{a.farmer?.name}</div>
                    <div className="appt-detail">{a.animal?.tagId} — {a.animal?.species}</div>
                    <div className="appt-detail">{a.serviceType?.replace(/_/g,' ')}</div>
                  </div>
                  <span className={`badge ${a.status}`}>{a.status}</span>
                </div>
              ))}
            </div>
          ) : <p className="empty">{L.noAppts}</p>}
        </div>
      </div>
    </div>
  );
}
