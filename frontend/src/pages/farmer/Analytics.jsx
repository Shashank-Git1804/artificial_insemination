import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../api/axios';
import { useLang } from '../../context/LanguageContext';
import { exportAnalyticsPDF, exportAnalyticsExcel, exportCSV } from '../../utils/exportUtils';

const COLORS = ['#2e7d32','#1565c0','#f57f17','#6a1b9a','#c62828'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function FarmerAnalytics() {
  const { lang } = useLang();
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)).catch(console.error); }, []);

  const L = {
    title:    lang==='kn'?'ನನ್ನ ಡೇಟಾ ವಿಶ್ಲೇಷಣೆ':lang==='hi'?'मेरा डेटा विश्लेषण':'My Analytics',
    species:  lang==='kn'?'ಜಾತಿ ಪ್ರಕಾರ ಪ್ರಾಣಿಗಳು':lang==='hi'?'प्रजाति अनुसार पशु':'Animals by Species',
    gender:   lang==='kn'?'ಲಿಂಗ ಪ್ರಕಾರ':lang==='hi'?'लिंग अनुसार':'By Gender',
    services: lang==='kn'?'ಸೇವೆ ಪ್ರಕಾರ':lang==='hi'?'सेवा अनुसार':'By Service',
    trend:    lang==='kn'?'AI ತಪಾಸಣೆ ಟ್ರೆಂಡ್':lang==='hi'?'AI जांच ट्रेंड':'AI Check Trend',
  };

  if (!data) return <div className="loading">{lang==='kn'?'ಲೋಡ್ ಆಗುತ್ತಿದೆ...':lang==='hi'?'लोड हो रहा है...':'Loading...'}</div>;

  // Build monthly prediction trend
  const months = MONTHS.map((m, i) => {
    const heat = data.predictionsByMonth?.filter(p => p._id.m === i+1 && p._id.type === 'heat').reduce((s,p)=>s+p.count,0)||0;
    const inf  = data.predictionsByMonth?.filter(p => p._id.m === i+1 && p._id.type === 'infection').reduce((s,p)=>s+p.count,0)||0;
    return { month: m, heat, infection: inf };
  });

  return (
    <div className="page">
      <div className="page-header">
        <h2>📊 {L.title}</h2>
        <div className="export-btns">
          <button className="export-btn pdf" onClick={() => exportAnalyticsPDF(data, 'farmer', L.title)}>📄 PDF</button>
          <button className="export-btn excel" onClick={() => exportAnalyticsExcel(data, 'farmer')}>📊 Excel</button>
          <button className="export-btn csv" onClick={() => exportCSV(data.animalsBySpecies?.map(s=>({Species:s._id,Count:s.count})),'my_animals')}>📋 CSV</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-icon">🐄</div><div className="stat-value">{data.totalAnimals}</div><div className="stat-label">{lang==='kn'?'ಒಟ್ಟು ಪ್ರಾಣಿಗಳು':lang==='hi'?'कुल पशु':'Total Animals'}</div></div>
        <div className="stat-card red"><div className="stat-icon">🌡️</div><div className="stat-value">{data.heatPositive}</div><div className="stat-label">{lang==='kn'?'ಗರ್ಭಧಾರಣೆ ಪತ್ತೆ':lang==='hi'?'गर्मी पहचान':'Heat Detections'}</div></div>
        <div className="stat-card orange"><div className="stat-icon">🔬</div><div className="stat-value">{data.infections}</div><div className="stat-label">{lang==='kn'?'ರೋಗ ಎಚ್ಚರಿಕೆ':lang==='hi'?'बीमारी चेतावनी':'Infection Alerts'}</div></div>
        <div className="stat-card green"><div className="stat-icon">📅</div><div className="stat-value">{data.pendingAppointments}</div><div className="stat-label">{lang==='kn'?'ಬಾಕಿ ಅಪಾಯಿಂಟ್ಮೆಂಟ್':lang==='hi'?'बकाया अपॉइंटमेंट':'Pending Appointments'}</div></div>
      </div>

      <div className="analytics-grid">
        {/* Species Pie */}
        <div className="card chart-card">
          <div className="chart-header"><h3>{L.species}</h3>
            <button className="export-btn-sm" onClick={() => exportCSV(data.animalsBySpecies?.map(s=>({Species:s._id,Count:s.count})),'species')}>CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.animalsBySpecies} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({_id,count})=>`${_id}:${count}`}>
                {data.animalsBySpecies?.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Pie */}
        <div className="card chart-card">
          <div className="chart-header"><h3>{L.gender}</h3></div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.animalsByGender} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({_id,count})=>`${_id}:${count}`}>
                {data.animalsByGender?.map((_,i)=><Cell key={i} fill={i===0?'#1565c0':'#c62828'}/>)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Services Bar */}
        {data.appointmentsByService?.length > 0 && (
          <div className="card chart-card">
            <div className="chart-header"><h3>{L.services}</h3></div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.appointmentsByService?.map(s=>({name:s._id?.replace(/_/g,' '),count:s.count}))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{fontSize:10}} />
                <YAxis dataKey="name" type="category" tick={{fontSize:9}} width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="#2e7d32" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI Check Trend Line */}
        <div className="card chart-card wide">
          <div className="chart-header"><h3>{L.trend}</h3>
            <button className="export-btn-sm" onClick={() => exportCSV(months,'ai_trend')}>CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={months}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="heat" stroke="#c62828" strokeWidth={2} dot={false} name={lang==='kn'?'ಗರ್ಭಧಾರಣೆ':lang==='hi'?'गर्मी':'Heat'} />
              <Line type="monotone" dataKey="infection" stroke="#f57f17" strokeWidth={2} dot={false} name={lang==='kn'?'ರೋಗ':lang==='hi'?'बीमारी':'Infection'} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
