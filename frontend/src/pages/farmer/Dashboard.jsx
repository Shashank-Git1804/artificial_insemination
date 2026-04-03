import { useEffect, useState, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';

const COLORS = ['#2e7d32', '#1565c0', '#f57f17', '#6a1b9a', '#c62828'];

// Multilingual carousel data
const FARMER_CIRCULARS = {
  en: [
    { id:1, icon:'📢', tag:'Govt Scheme', title:'Rashtriya Gokul Mission 2024-25',
      body:'Karnataka farmers eligible for ₹50,000 subsidy on purchase of high-yielding indigenous breed cattle. Apply at your nearest Pashu Seva Kendra.',
      date:'Jan 2025', color:'#e8f5e9', border:'#2e7d32' },
    { id:2, icon:'💉', tag:'Health Alert', title:'Free FMD Vaccination Drive',
      body:'Foot & Mouth Disease vaccination camp scheduled across all Karnataka districts. Contact your local veterinary officer for dates.',
      date:'Feb 2025', color:'#e3f2fd', border:'#1565c0' },
    { id:3, icon:'🐄', tag:'AI Service', title:'Doorstep AI Service — Free for BPL Farmers',
      body:'Under KSBB scheme, BPL card holders get free artificial insemination at doorstep. Register on Pashimitra to avail this benefit.',
      date:'Mar 2025', color:'#fff8e1', border:'#f57f17' },
    { id:4, icon:'🌾', tag:'Advisory', title:'Summer Livestock Care Advisory',
      body:'Ensure adequate water (50L/day for cattle), shade, and electrolyte supplements during summer. Reduce heat stress to maintain milk yield.',
      date:'Apr 2025', color:'#f3e5f5', border:'#6a1b9a' },
    { id:5, icon:'💰', tag:'Insurance', title:'Livestock Insurance — PMFBY',
      body:'Insure your cattle under Pradhan Mantri Fasal Bima Yojana. Premium as low as ₹100/animal. Claim up to ₹50,000 in case of death.',
      date:'May 2025', color:'#ffebee', border:'#c62828' },
  ],
  kn: [
    { id:1, icon:'📢', tag:'ಸರ್ಕಾರಿ ಯೋಜನೆ', title:'ರಾಷ್ಟ್ರೀಯ ಗೋಕುಲ್ ಮಿಷನ್ 2024-25',
      body:'ಕರ್ನಾಟಕ ರೈತರಿಗೆ ಉತ್ತಮ ತಳಿಯ ದೇಶೀ ಹಸು ಖರೀದಿಗೆ ₹50,000 ಸಹಾಯಧನ. ನಿಮ್ಮ ಹತ್ತಿರದ ಪಶು ಸೇವಾ ಕೇಂದ್ರದಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.',
      date:'ಜನ 2025', color:'#e8f5e9', border:'#2e7d32' },
    { id:2, icon:'💉', tag:'ಆರೋಗ್ಯ ಎಚ್ಚರಿಕೆ', title:'ಉಚಿತ FMD ಲಸಿಕೆ ಶಿಬಿರ',
      body:'ಕರ್ನಾಟಕದ ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳಲ್ಲಿ ಕಾಲು ಮತ್ತು ಬಾಯಿ ರೋಗ ಲಸಿಕೆ ಶಿಬಿರ. ದಿನಾಂಕಕ್ಕಾಗಿ ನಿಮ್ಮ ಸ್ಥಳೀಯ ಪಶು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
      date:'ಫೆಬ್ 2025', color:'#e3f2fd', border:'#1565c0' },
    { id:3, icon:'🐄', tag:'AI ಸೇವೆ', title:'BPL ರೈತರಿಗೆ ಉಚಿತ ಮನೆ ಬಾಗಿಲಿಗೆ AI ಸೇವೆ',
      body:'KSBB ಯೋಜನೆಯಡಿ BPL ಕಾರ್ಡ್ ಹೊಂದಿರುವ ರೈತರಿಗೆ ಮನೆ ಬಾಗಿಲಿಗೆ ಉಚಿತ ಕೃತಕ ಗರ್ಭಧಾರಣೆ. Pashimitra ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ.',
      date:'ಮಾರ್ 2025', color:'#fff8e1', border:'#f57f17' },
    { id:4, icon:'🌾', tag:'ಸಲಹೆ', title:'ಬೇಸಿಗೆ ಪಶು ಆರೈಕೆ ಸಲಹೆ',
      body:'ದಿನಕ್ಕೆ 50 ಲೀಟರ್ ನೀರು, ನೆರಳು ಮತ್ತು ಎಲೆಕ್ಟ್ರೋಲೈಟ್ ಪೂರಕ ನೀಡಿ. ಹಾಲಿನ ಇಳುವರಿ ಕಾಪಾಡಲು ಶಾಖ ಒತ್ತಡ ಕಡಿಮೆ ಮಾಡಿ.',
      date:'ಏಪ್ರಿ 2025', color:'#f3e5f5', border:'#6a1b9a' },
    { id:5, icon:'💰', tag:'ವಿಮೆ', title:'ಪಶು ವಿಮೆ — PMFBY',
      body:'ಪ್ರಧಾನ ಮಂತ್ರಿ ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆಯಡಿ ನಿಮ್ಮ ಜಾನುವಾರು ವಿಮೆ ಮಾಡಿ. ₹100/ಪ್ರಾಣಿ ಪ್ರೀಮಿಯಂ. ಮರಣ ಸಂದರ್ಭದಲ್ಲಿ ₹50,000 ವರೆಗೆ ಪರಿಹಾರ.',
      date:'ಮೇ 2025', color:'#ffebee', border:'#c62828' },
  ],
  hi: [
    { id:1, icon:'📢', tag:'सरकारी योजना', title:'राष्ट्रीय गोकुल मिशन 2024-25',
      body:'कर्नाटक के किसानों को उच्च उत्पादक देशी नस्ल की गाय खरीदने पर ₹50,000 की सब्सिडी। अपने नजदीकी पशु सेवा केंद्र में आवेदन करें।',
      date:'जन 2025', color:'#e8f5e9', border:'#2e7d32' },
    { id:2, icon:'💉', tag:'स्वास्थ्य चेतावनी', title:'मुफ्त FMD टीकाकरण अभियान',
      body:'कर्नाटक के सभी जिलों में खुरपका-मुंहपका रोग टीकाकरण शिविर। तारीखों के लिए अपने स्थानीय पशु चिकित्सक से संपर्क करें।',
      date:'फर 2025', color:'#e3f2fd', border:'#1565c0' },
    { id:3, icon:'🐄', tag:'AI सेवा', title:'BPL किसानों के लिए मुफ्त घर पर AI सेवा',
      body:'KSBB योजना के तहत BPL कार्ड धारकों को घर पर मुफ्त कृत्रिम गर्भाधान। Pashimitra पर पंजीकरण करें।',
      date:'मार 2025', color:'#fff8e1', border:'#f57f17' },
    { id:4, icon:'🌾', tag:'सलाह', title:'गर्मी में पशु देखभाल सलाह',
      body:'प्रतिदिन 50 लीटर पानी, छाया और इलेक्ट्रोलाइट सप्लीमेंट दें। दूध उत्पादन बनाए रखने के लिए गर्मी का तनाव कम करें।',
      date:'अप्र 2025', color:'#f3e5f5', border:'#6a1b9a' },
    { id:5, icon:'💰', tag:'बीमा', title:'पशु बीमा — PMFBY',
      body:'प्रधानमंत्री फसल बीमा योजना के तहत अपने पशुओं का बीमा करें। ₹100/पशु प्रीमियम। मृत्यु पर ₹50,000 तक मुआवजा।',
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

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <div className="loading">{t('loading')}</div>;

  const pieData = data.animalsBySpecies?.map(s => ({ name: s._id, value: s.count })) || [];
  const circulars = FARMER_CIRCULARS[lang] || FARMER_CIRCULARS.en;

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('welcome')}, {user?.name} 👋</h2>
        <p>Karnataka Livestock AI Management — Pashimitra</p>
      </div>

      <div className="section-label">📋 {t('govtCirculars')}</div>
      <Carousel items={circulars} />

      <div className="stats-grid" style={{ marginTop:'24px' }}>
        <div className="stat-card blue">
          <div className="stat-icon">🐄</div>
          <div className="stat-value">{data.totalAnimals}</div>
          <div className="stat-label">{t('totalAnimals')}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">🌡️</div>
          <div className="stat-value">{data.heatPositive}</div>
          <div className="stat-label">{t('heatDetections')}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">🔬</div>
          <div className="stat-value">{data.infections}</div>
          <div className="stat-label">{t('infectionAlerts')}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{data.pendingAppointments}</div>
          <div className="stat-label">{t('pendingAppointments')}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>{t('animalsBySpecies')}</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="empty">{lang==='kn'?'ಇನ್ನೂ ಪ್ರಾಣಿಗಳು ನೋಂದಾಯಿಸಿಲ್ಲ':lang==='hi'?'अभी कोई पशु नहीं':'No animals registered yet'}</p>}
        </div>

        <div className="card">
          <h3>{t('recentPredictions')}</h3>
          {data.recentPredictions?.length > 0 ? (
            <div className="prediction-list">
              {data.recentPredictions.map(p => (
                <div key={p._id} className={`prediction-item ${p.result}`}>
                  <div className="pred-info">
                    <span className="pred-species">{p.animal?.species} — {p.animal?.tagId}</span>
                    <span className="pred-type">{p.type==='heat'?'🌡️ '+t('heatDetection'):'🔬 '+t('healthCheck')}</span>
                  </div>
                  <span className={`badge ${p.result}`}>
                    {p.result==='positive'
                      ? (lang==='kn'?'⚠️ ಪಾಸಿಟಿವ್':lang==='hi'?'⚠️ पॉजिटिव':'⚠️ Positive')
                      : (lang==='kn'?'✅ ನೆಗೆಟಿವ್':lang==='hi'?'✅ नेगेटिव':'✅ Negative')}
                  </span>
                </div>
              ))}
            </div>
          ) : <p className="empty">{lang==='kn'?'ಇನ್ನೂ ತಪಾಸಣೆ ಇಲ್ಲ':lang==='hi'?'अभी कोई जांच नहीं':'No predictions yet'}</p>}
        </div>
      </div>
    </div>
  );
}
