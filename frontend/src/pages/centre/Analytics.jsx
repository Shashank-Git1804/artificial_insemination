import { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import api from '../../api/axios';
import { useLang } from '../../context/LanguageContext';
import { exportAnalyticsPDF, exportAnalyticsExcel, exportCSV } from '../../utils/exportUtils';

const COLORS = ['#2e7d32','#1565c0','#f57f17','#6a1b9a','#c62828','#00838f','#558b2f','#4527a0'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function CentreAnalytics() {
  const { lang } = useLang();
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)).catch(console.error); }, []);

  const L = {
    title:      lang==='kn'?'ಡೇಟಾ ವಿಶ್ಲೇಷಣೆ':lang==='hi'?'डेटा विश्लेषण':'Data Analytics',
    export:     lang==='kn'?'ರಫ್ತು':lang==='hi'?'निर्यात':'Export',
    species:    lang==='kn'?'ಜಾತಿ ಪ್ರಕಾರ ಪ್ರಾಣಿಗಳು':lang==='hi'?'प्रजाति अनुसार पशु':'Animals by Species',
    gender:     lang==='kn'?'ಲಿಂಗ ಪ್ರಕಾರ ಪ್ರಾಣಿಗಳು':lang==='hi'?'लिंग अनुसार पशु':'Animals by Gender',
    district:   lang==='kn'?'ಜಿಲ್ಲೆ ಪ್ರಕಾರ ರೈತರು':lang==='hi'?'जिला अनुसार किसान':'Farmers by District',
    monthly:    lang==='kn'?'ಮಾಸಿಕ ನೋಂದಣಿ':lang==='hi'?'मासिक पंजीकरण':'Monthly Farmer Registrations',
    services:   lang==='kn'?'ಸೇವೆ ಪ್ರಕಾರ ಅಪಾಯಿಂಟ್ಮೆಂಟ್':lang==='hi'?'सेवा अनुसार अपॉइंटमेंट':'Appointments by Service',
    heatSp:     lang==='kn'?'ಜಾತಿ ಪ್ರಕಾರ ಗರ್ಭಧಾರಣೆ ಪತ್ತೆ':lang==='hi'?'प्रजाति अनुसार गर्मी पहचान':'Heat Detections by Species',
    apptTrend:  lang==='kn'?'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಟ್ರೆಂಡ್':lang==='hi'?'अपॉइंटमेंट ट्रेंड':'Appointment Trend',
  };

  if (!data) return <div className="loading">{lang==='kn'?'ಲೋಡ್ ಆಗುತ್ತಿದೆ...':lang==='hi'?'लोड हो रहा है...':'Loading...'}</div>;

  // Build monthly registration chart data
  const monthlyReg = Array.from({ length: 12 }, (_, i) => {
    const found = data.farmersRegisteredMonthly?.find(m => m._id.m === i + 1);
    return { month: MONTHS[i], farmers: found?.count || 0 };
  });

  // Build appointment trend
  const apptTrend = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const completed = data.appointmentsByMonth?.filter(m => m._id.m === month && m._id.status === 'completed').reduce((s, m) => s + m.count, 0) || 0;
    const pending   = data.appointmentsByMonth?.filter(m => m._id.m === month && m._id.status === 'pending').reduce((s, m) => s + m.count, 0) || 0;
    return { month: MONTHS[i], completed, pending };
  });

  const handleExportPDF   = () => exportAnalyticsPDF(data, 'ai_centre', L.title);
  const handleExportExcel = () => exportAnalyticsExcel(data, 'ai_centre');
  const handleExportCSV   = () => exportCSV(data.animalsBySpecies?.map(s => ({ Species: s._id, Count: s.count })), 'animals_by_species');

  return (
    <div className="page">
      <div className="page-header">
        <h2>📊 {L.title}</h2>
        <div className="export-btns">
          <button className="export-btn pdf" onClick={handleExportPDF}>📄 PDF</button>
          <button className="export-btn excel" onClick={handleExportExcel}>📊 Excel</button>
          <button className="export-btn csv" onClick={handleExportCSV}>📋 CSV</button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-icon">👨🌾</div><div className="stat-value">{data.totalFarmers}</div><div className="stat-label">{lang==='kn'?'ರೈತರು':lang==='hi'?'किसान':'Farmers'}</div></div>
        <div className="stat-card green"><div className="stat-icon">🐄</div><div className="stat-value">{data.totalAnimals}</div><div className="stat-label">{lang==='kn'?'ಪ್ರಾಣಿಗಳು':lang==='hi'?'पशु':'Animals'}</div></div>
        <div className="stat-card orange"><div className="stat-icon">📅</div><div className="stat-value">{data.pendingAppointments}</div><div className="stat-label">{lang==='kn'?'ಬಾಕಿ':lang==='hi'?'बकाया':'Pending'}</div></div>
        <div className="stat-card purple"><div className="stat-icon">✅</div><div className="stat-value">{data.completedAppointments}</div><div className="stat-label">{lang==='kn'?'ಪೂರ್ಣ':lang==='hi'?'पूर्ण':'Completed'}</div></div>
      </div>

      <div className="analytics-grid">
        {/* Animals by Species — Pie */}
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

        {/* Animals by Gender — Pie */}
        <div className="card chart-card">
          <div className="chart-header"><h3>{L.gender}</h3>
            <button className="export-btn-sm" onClick={() => exportCSV(data.animalsByGender?.map(g=>({Gender:g._id,Count:g.count})),'gender')}>CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.animalsByGender} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({_id,count})=>`${_id}:${count}`}>
                {data.animalsByGender?.map((_,i)=><Cell key={i} fill={i===0?'#1565c0':'#c62828'}/>)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Farmer Registrations — Bar */}
        <div className="card chart-card wide">
          <div className="chart-header"><h3>{L.monthly}</h3>
            <button className="export-btn-sm" onClick={() => exportCSV(monthlyReg,'monthly_registrations')}>CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyReg}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip />
              <Bar dataKey="farmers" fill="#2e7d32" radius={[4,4,0,0]} name={lang==='kn'?'ರೈತರು':lang==='hi'?'किसान':'Farmers'} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Appointments by Service — Bar */}
        <div className="card chart-card">
          <div className="chart-header"><h3>{L.services}</h3>
            <button className="export-btn-sm" onClick={() => exportCSV(data.appointmentsByService?.map(s=>({Service:s._id?.replace(/_/g,' '),Count:s.count})),'services')}>CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.appointmentsByService?.map(s=>({name:s._id?.replace(/_/g,' '),count:s.count}))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{fontSize:10}} />
              <YAxis dataKey="name" type="category" tick={{fontSize:9}} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#1565c0" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Heat by Species — Bar */}
        <div className="card chart-card">
          <div className="chart-header"><h3>{L.heatSp}</h3>
            <button className="export-btn-sm" onClick={() => exportCSV(data.heatBySpecies?.map(h=>({Species:h._id,Count:h.count})),'heat_species')}>CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.heatBySpecies?.map(h=>({name:h._id,count:h.count}))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip />
              <Bar dataKey="count" fill="#c62828" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment Trend — Line */}
        <div className="card chart-card wide">
          <div className="chart-header"><h3>{L.apptTrend}</h3>
            <button className="export-btn-sm" onClick={() => exportCSV(apptTrend,'appointment_trend')}>CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={apptTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#2e7d32" strokeWidth={2} dot={false} name={lang==='kn'?'ಪೂರ್ಣ':lang==='hi'?'पूर्ण':'Completed'} />
              <Line type="monotone" dataKey="pending" stroke="#f57f17" strokeWidth={2} dot={false} name={lang==='kn'?'ಬಾಕಿ':lang==='hi'?'बकाया':'Pending'} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Farmers by District — Bar */}
        {data.farmersByDistrict?.length > 0 && (
          <div className="card chart-card wide">
            <div className="chart-header"><h3>{L.district}</h3>
              <button className="export-btn-sm" onClick={() => exportCSV(data.farmersByDistrict?.map(d=>({District:d._id||'Unknown',Farmers:d.count})),'district')}>CSV</button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.farmersByDistrict?.map(d=>({name:d._id||'Unknown',count:d.count}))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize:9}} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip />
                <Bar dataKey="count" fill="#6a1b9a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
