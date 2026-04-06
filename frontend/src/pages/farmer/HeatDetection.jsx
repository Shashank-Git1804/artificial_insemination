import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import ImageCapture from '../../components/ImageCapture';
import { useLang, translateWithSarvam } from '../../context/LanguageContext';

const SPECIES_EMOJI = { cow: '🐄', buffalo: '🐃', goat: '🐐', sheep: '🐑', pig: '🐷' };
const LEVEL_LABELS = {
  en: ['Not at all', 'A little', 'Quite a lot', 'Very much'],
  kn: ['ಇಲ್ಲ', 'ಸ್ವಲ್ಪ', 'ಸಾಕಷ್ಟು', 'ತುಂಬಾ'],
  hi: ['बिल्कुल नहीं', 'थोड़ा', 'काफी', 'बहुत'],
};
const toFloat = (v) => [0, 0.33, 0.66, 1.0][v] || 0;

const STAGES = [
  { key: 'csv',      icon: '📋', label: 'Step 1: Observations (CSV)',  desc: 'Based on your field observations only' },
  { key: 'photo',    icon: '📷', label: 'Step 2: Photo Analysis',       desc: 'Based on uploaded photo only' },
  { key: 'combined', icon: '🔬', label: 'Step 3: Combined Analysis',    desc: 'Observations + Photo fused together' },
];

function SimpleSlider({ label, hint, value, onChange, lang }) {
  const levels = LEVEL_LABELS[lang] || LEVEL_LABELS.en;
  return (
    <div className="simple-slider">
      <div className="simple-slider-label">{label}</div>
      {hint && <div className="simple-slider-hint">{hint}</div>}
      <div className="simple-slider-options">
        {levels.map((l, i) => (
          <button key={i} type="button"
            className={`level-btn ${value === i ? 'active' : ''}`}
            onClick={() => onChange(i)}>
            <span className="level-emoji">{i === 0 ? '😴' : i === 1 ? '🙂' : i === 2 ? '😟' : '😰'}</span>
            <span>{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FactorRow({ factor }) {
  const statusColor = factor.status === 'HIGH' ? '#e53e3e' : factor.status === 'MODERATE' ? '#d69e2e' : '#38a169';
  const statusBg    = factor.status === 'HIGH' ? '#fff5f5' : factor.status === 'MODERATE' ? '#fffff0' : '#f0fff4';
  const barColor    = factor.status === 'HIGH' ? '#e53e3e' : factor.status === 'MODERATE' ? '#d69e2e' : '#38a169';
  return (
    <div style={{ border: `1px solid ${statusColor}`, borderRadius: 8, padding: '10px 12px', marginBottom: 8, background: statusBg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: statusColor, color: '#fff', borderRadius: '50%', width: 22, height: 22,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {factor.factor_number}
          </span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{factor.name}</span>
          <span style={{ fontSize: 10, background: '#e2e8f0', borderRadius: 4, padding: '1px 5px', color: '#555' }}>
            {factor.source}
          </span>
        </div>
        <span style={{ fontWeight: 700, color: statusColor, fontSize: 13 }}>{factor.score_percent}%</span>
      </div>
      <div style={{ background: '#e2e8f0', borderRadius: 4, height: 6, marginBottom: 6 }}>
        <div style={{ width: `${factor.score_percent}%`, background: barColor, height: 6, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#555' }}>{factor.explanation}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, whiteSpace: 'nowrap', marginLeft: 8 }}>
          {factor.verdict}
        </span>
      </div>
    </div>
  );
}

function StageResult({ stageResult, cycleInfo, lang }) {
  const [showFactors, setShowFactors] = useState(false);
  if (!stageResult) return null;
  const r = stageResult;
  const report = r.aiDetail?.detailed_report;
  const isHeat = r.result === 'positive';

  return (
    <div className={`card result-card ${r.result}`} style={{ marginTop: 0 }}>
      {r.blocked ? (
        <>
          <div className="result-icon">🚫</div>
          <h3>
            {r.rule_failed === 3 ? '📷 Blurry Photo' :
             r.rule_failed === 2 ? '🔍 Reproductive Area Not Visible' :
             r.rule_failed === 1 ? '🐄 Wrong Animal Species' :
             r.rule_failed === 4 ? '❌ Invalid Photo' : 'Invalid Photo'}
          </h3>
          <div style={{ color: 'var(--danger)', marginBottom: 8, fontSize: 14 }}>{r.error}</div>
          <div className="action-box warning">
            <p>📌 <strong>What to do:</strong> {r.action}</p>
            {r.rule_failed === 3 && <p>💡 Tip: Hold phone steady, ensure good lighting, tap to focus before clicking.</p>}
            {r.rule_failed === 2 && <p>💡 Tip: Take a close-up photo of the rear/vulva area of the animal.</p>}
            {r.rule_failed === 1 && <p>💡 Tip: Make sure you selected the correct species and the photo shows that animal.</p>}
          </div>
        </>
      ) : (
        <>
          {/* Verdict */}
          <div className="result-status-big">
            <div className={isHeat ? 'status-positive' : 'status-negative'}>
              <div className="status-emoji">{isHeat ? '🔴' : '✅'}</div>
              <div className="status-text">{isHeat ? 'Heat Detected!' : 'Not in Heat'}</div>
              <div className="status-sub">{isHeat ? 'Book AI service now' : 'Monitor next cycle'}</div>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="confidence-simple">
            <div className="conf-label">AI Confidence</div>
            <div className="conf-meter">
              <div className="conf-fill" style={{
                width: `${r.confidence}%`,
                background: r.confidence > 70 ? 'var(--primary)' : r.confidence > 50 ? 'var(--secondary)' : '#ccc'
              }} />
            </div>
            <div className="conf-value">{r.confidence}%
              <span className="conf-word">
                {r.confidence > 80 ? ' (Sure)' : r.confidence > 60 ? ' (Likely)' : ' (Uncertain)'}
              </span>
            </div>
          </div>

          {/* Summary from report */}
          {report?.summary && (
            <div style={{ background: isHeat ? '#fff5f5' : '#f0fff4', border: `1px solid ${isHeat ? '#feb2b2' : '#9ae6b4'}`,
              borderRadius: 8, padding: '10px 14px', margin: '10px 0', fontSize: 13, fontWeight: 600,
              color: isHeat ? '#c53030' : '#276749' }}>
              {report.summary}
            </div>
          )}

          {/* Factor score breakdown */}
          {report?.factors?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setShowFactors(v => !v)}
                style={{ background: 'none', border: '1px solid #cbd5e0', borderRadius: 6, padding: '6px 12px',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2d3748', width: '100%', textAlign: 'left' }}>
                {showFactors ? '▲' : '▼'} &nbsp;
                📊 Detailed Factor Report — {report.positive_factors} positive / {report.moderate_factors} moderate / {report.negative_factors} negative out of {report.total_factors} factors
              </button>
              {showFactors && (
                <div style={{ marginTop: 10 }}>
                  {report.factors.map(f => <FactorRow key={f.factor_number} factor={f} />)}
                </div>
              )}
            </div>
          )}

          {/* Next heat info for negative */}
          {!isHeat && cycleInfo && (
            <div className="next-heat-info">
              <div className="next-heat-title">📅 Next Expected Heat</div>
              <div className="next-heat-days">~{cycleInfo.cycle_length_days} days</div>
              <div className="next-heat-signs">
                <strong>Watch for:</strong>
                <div className="signs-list">
                  {cycleInfo.signs?.map((s, i) => <span key={i} className="sign-tag">{s}</span>)}
                </div>
              </div>
            </div>
          )}

          {/* Action steps for positive */}
          {isHeat && (
            <div className="action-steps">
              <div className="action-step urgent">
                <span className="step-num">1</span>
                <div>
                  <div className="step-title">Call AI Centre Now</div>
                  <div className="step-desc">Best window: {cycleInfo?.best_ai_window || '12-18 hours'}</div>
                </div>
              </div>
              <div className="action-step">
                <span className="step-num">2</span>
                <div>
                  <div className="step-title">Separate the Animal</div>
                  <div className="step-desc">Keep away from male animals</div>
                </div>
              </div>
              <div className="action-step">
                <span className="step-num">3</span>
                <div>
                  <div className="step-title">Book Appointment</div>
                  <div className="step-desc">Via Jeeva app</div>
                </div>
              </div>
            </div>
          )}

          {/* Weight warning */}
          {r.aiDetail?.weight_validation && !r.aiDetail.weight_validation.valid && (
            <div className="action-box warning">⚖️ {r.aiDetail.weight_validation.message}</div>
          )}
        </>
      )}
    </div>
  );
}

export default function HeatDetection() {
  const { t, lang } = useLang();
  const [animals, setAnimals]     = useState([]);
  const [selectedAnimal, setSelected] = useState(null);
  const [cycleInfo, setCycleInfo] = useState(null);
  const [activeStage, setActiveStage] = useState('csv');
  const [results, setResults]     = useState({ csv: null, photo: null, combined: null });
  const [loadingStage, setLoadingStage] = useState(null);
  const [image, setImage]         = useState(null);
  const [form, setForm] = useState({ animalId: '', activity: 0, restlessness: 0, mounting: 0, vision: 0 });

  useEffect(() => {
    api.get('/animals').then(r => {
      const females = r.data.filter(a => a.gender === 'female');
      setAnimals(females);
      if (females.length > 0) {
        setForm(f => ({ ...f, animalId: females[0]._id }));
        setSelected(females[0]);
        fetchCycle(females[0].species);
      }
    });
  }, []);

  const fetchCycle = (species) =>
    api.get(`/predictions/cycle/${species}`).then(r => setCycleInfo(r.data)).catch(() => setCycleInfo(null));

  const handleAnimalChange = (id) => {
    const a = animals.find(x => x._id === id);
    setSelected(a || null);
    setForm(f => ({ ...f, animalId: id }));
    setResults({ csv: null, photo: null, combined: null });
    if (a) fetchCycle(a.species);
  };

  const runStage = async (stage) => {
    if (!form.animalId) return toast.error('Please select an animal');
    if (stage === 'photo' && !image) return toast.error('Please upload a photo for photo analysis');
    if (stage === 'combined' && !image) return toast.error('Please upload a photo for combined analysis');

    setLoadingStage(stage);
    try {
      const fd = new FormData();
      fd.append('animalId', form.animalId);
      fd.append('stage',    stage);

      // For photo stage: zero out all observation fields so result is image-only
      const isPhotoOnly = stage === 'photo';
      fd.append('activitySpike',    isPhotoOnly ? '0' : toFloat(form.activity).toString());
      fd.append('restlessness',     isPhotoOnly ? '0' : toFloat(form.restlessness).toString());
      fd.append('mountingEvents',   isPhotoOnly ? '0' : toFloat(form.mounting).toString());
      fd.append('visionModelScore', isPhotoOnly ? '0' : toFloat(form.vision).toString());

      if (image && stage !== 'csv') fd.append('image', image);

      const { data } = await api.post('/predictions/heat', fd);
      setResults(prev => ({ ...prev, [stage]: data }));
      toast.success(`Step ${STAGES.findIndex(s => s.key === stage) + 1} analysis complete!`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = detail?.error || err.response?.data?.message || 'Analysis failed';
      if (err.response?.status === 413)
        toast.error('Photo is too large even after compression. Please use a smaller image.', { duration: 6000 });
      else
        toast.error(msg, { duration: 6000 });
      if (err.response?.status === 422 && detail) {
        setResults(prev => ({ ...prev, [stage]: {
          blocked: true,
          error: detail.error,
          action: detail.action,
          rule_failed: detail.rule_failed,
        }}));
      }
    } finally {
      setLoadingStage(null);
    }
  };

  const runAll = async () => {
    if (!form.animalId) return toast.error('Please select an animal');
    if (!image) return toast.error('Please upload a photo to run all 3 stages');
    for (const s of ['csv', 'photo', 'combined']) {
      await runStage(s);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>🌡️ {t('heatDetectionTitle')}</h2>
        <p>3-Stage AI Heat Detection — Karnataka Govt Jeeva</p>
      </div>

      {/* Cycle banner */}
      {cycleInfo && selectedAnimal && (
        <div className="cycle-banner">
          <div className="cycle-banner-title">
            {SPECIES_EMOJI[selectedAnimal.species]} {selectedAnimal.species?.toUpperCase()} — Reproductive Cycle
          </div>
          <div className="cycle-grid">
            <div className="cycle-item"><span>Cycle Length</span><strong>{cycleInfo.cycle_range}</strong></div>
            <div className="cycle-item"><span>Heat Duration</span><strong>{cycleInfo.heat_duration_hours}</strong></div>
            <div className="cycle-item"><span>Best AI Window</span><strong>{cycleInfo.best_ai_window}</strong></div>
            <div className="cycle-item"><span>Gestation</span><strong>{cycleInfo.gestation_range}</strong></div>
          </div>
          <div className="cycle-signs">
            <span>Watch for: </span>
            {cycleInfo.signs?.map((s, i) => <span key={i} className="sign-tag">{s}</span>)}
          </div>
        </div>
      )}

      {/* Input form */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Animal & Observations</h3>
        <div className="form-group">
          <label>{t('selectAnimal')} *</label>
          <select value={form.animalId} onChange={e => handleAnimalChange(e.target.value)} required>
            <option value="">{t('selectFemaleAnimal')}</option>
            {animals.map(a => (
              <option key={a._id} value={a._id}>
                {SPECIES_EMOJI[a.species]} {a.tagId} — {a.name || a.species}{a.breed ? ` (${a.breed})` : ''}
              </option>
            ))}
          </select>
          {selectedAnimal && (
            <div className="selected-animal-info">
              {SPECIES_EMOJI[selectedAnimal.species]} {selectedAnimal.species} | {selectedAnimal.breed || 'Unknown breed'} |
              Age: {selectedAnimal.age || '?'} yrs | Weight: {selectedAnimal.weight || '?'} kg
            </div>
          )}
        </div>

        <SimpleSlider label={t('activitySpike')}   hint={t('activityHint')}     value={form.activity}     onChange={v => setForm(f => ({ ...f, activity: v }))}     lang={lang} />
        <SimpleSlider label={t('restlessness')}     hint={t('restlessnessHint')} value={form.restlessness} onChange={v => setForm(f => ({ ...f, restlessness: v }))} lang={lang} />
        <SimpleSlider label={t('mountingEvents')}   hint={t('mountingHint')}     value={form.mounting}     onChange={v => setForm(f => ({ ...f, mounting: v }))}     lang={lang} />

        <ImageCapture label={`📷 ${t('photoLabel')} (required for Step 2 & 3)`} onCapture={setImage} />

        <button onClick={runAll} className="btn-primary full-width" disabled={!!loadingStage}
          style={{ marginTop: 12 }}>
          {loadingStage ? `🔄 Running ${STAGES.find(s => s.key === loadingStage)?.label}...` : '🚀 Run All 3 Stages'}
        </button>
      </div>

      {/* Stage tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {STAGES.map((s, idx) => {
          const r = results[s.key];
          const done = !!r && !r.blocked;
          const isHeat = r?.result === 'positive';
          return (
            <button key={s.key} onClick={() => setActiveStage(s.key)}
              style={{
                flex: 1, minWidth: 140, padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                border: activeStage === s.key ? '2px solid var(--primary)' : '2px solid #e2e8f0',
                background: activeStage === s.key ? 'var(--primary)' : '#fff',
                color: activeStage === s.key ? '#fff' : '#2d3748',
                fontWeight: 600, fontSize: 13, textAlign: 'center',
              }}>
              <div>{s.icon} Step {idx + 1}</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>{s.key === 'csv' ? 'Observations' : s.key === 'photo' ? 'Photo' : 'Combined'}</div>
              {done && (
                <div style={{ fontSize: 11, marginTop: 2, color: activeStage === s.key ? '#fff' : (isHeat ? '#e53e3e' : '#38a169'), fontWeight: 700 }}>
                  {isHeat ? '🔴 Heat' : '✅ No Heat'} — {r.confidence}%
                </div>
              )}
              {loadingStage === s.key && <div style={{ fontSize: 11, marginTop: 2 }}>🔄 Analyzing...</div>}
            </button>
          );
        })}
      </div>

      {/* Per-stage run button */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {STAGES.map((s, idx) => (
          <button key={s.key} onClick={() => runStage(s.key)} disabled={!!loadingStage}
            style={{ flex: 1, minWidth: 140, padding: '8px 6px', borderRadius: 6, cursor: 'pointer',
              border: '1px solid #cbd5e0', background: '#f7fafc', fontSize: 12, fontWeight: 600, color: '#4a5568' }}>
            {loadingStage === s.key ? '🔄 Running...' : `${s.icon} Run Step ${idx + 1} Only`}
          </button>
        ))}
      </div>

      {/* Active stage result */}
      <StageResult stageResult={results[activeStage]} cycleInfo={cycleInfo} lang={lang} />

      {/* Combined comparison if all 3 done */}
      {results.csv && results.photo && results.combined && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>📊 3-Stage Comparison Summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f7fafc' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Stage</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Verdict</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Confidence</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Factors</th>
              </tr>
            </thead>
            <tbody>
              {STAGES.map((s, idx) => {
                const r = results[s.key];
                if (!r || r.blocked) return null;
                const report = r.aiDetail?.detailed_report;
                const isHeat = r.result === 'positive';
                return (
                  <tr key={s.key} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.icon} Step {idx + 1}: {s.key === 'csv' ? 'Observations' : s.key === 'photo' ? 'Photo' : 'Combined'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: isHeat ? '#e53e3e' : '#38a169' }}>
                      {isHeat ? '🔴 IN HEAT' : '✅ NOT IN HEAT'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ background: '#e2e8f0', borderRadius: 4, height: 8, width: 80, margin: '0 auto 2px' }}>
                        <div style={{ width: `${r.confidence}%`, height: 8, borderRadius: 4,
                          background: r.confidence > 70 ? '#38a169' : r.confidence > 50 ? '#d69e2e' : '#e53e3e' }} />
                      </div>
                      {r.confidence}%
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12 }}>
                      {report ? `${report.positive_factors}✅ ${report.moderate_factors}⚠️ ${report.negative_factors}❌ / ${report.total_factors}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 10, padding: '10px 12px', background: '#ebf8ff', borderRadius: 8, fontSize: 13, color: '#2b6cb0' }}>
            <strong>Final Recommendation:</strong>{' '}
            {results.combined.result === 'positive'
              ? `🔴 Heat confirmed by combined analysis (${results.combined.confidence}% confidence). Book AI service within ${cycleInfo?.best_ai_window || '12-18 hours'}.`
              : `✅ Not in heat per combined analysis (${results.combined.confidence}% confidence). Next heat expected in ~${cycleInfo?.cycle_length_days || 21} days.`}
          </div>
        </div>
      )}
    </div>
  );
}
