import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import ImageCapture from '../../components/ImageCapture';

const SPECIES_EMOJI = { cow: '🐄', buffalo: '🐃', goat: '🐐', sheep: '🐑', pig: '🐷' };

const STAGES = [
  { key: 'csv',      icon: '📋', label: 'Step 1: Symptoms (CSV)',   desc: 'Based on observed symptoms only' },
  { key: 'photo',    icon: '📷', label: 'Step 2: Photo Analysis',   desc: 'Based on uploaded photo only' },
  { key: 'combined', icon: '🔬', label: 'Step 3: Combined Analysis', desc: 'Symptoms + Photo fused together' },
];

const SYMPTOM_FIELDS = [
  { key: 'abnormalDischarge',      label: 'Abnormal Discharge',       hint: 'Unusual vaginal discharge (colour, consistency)' },
  { key: 'purulentDischarge',      label: 'Purulent (Pus) Discharge', hint: 'Pus-like discharge — strong infection indicator' },
  { key: 'swellingOrLesion',       label: 'Swelling / Lesion',        hint: 'Visible swelling, wounds or lesions on reproductive area' },
  { key: 'fever',                  label: 'Fever',                    hint: 'Elevated body temperature (>39.5°C for cattle)' },
  { key: 'bloodContamination',     label: 'Blood Contamination',      hint: 'Blood in discharge outside normal calving period' },
  { key: 'foulSmell',              label: 'Foul Odour',               hint: 'Offensive smell from discharge' },
  { key: 'repeatAiFailureHistory', label: 'Repeat AI Failure History',hint: 'Previous AI attempts that did not result in pregnancy' },
];

const LEVEL_LABELS = ['None', 'Mild', 'Moderate', 'Severe'];
const toFloat = (v) => [0, 0.33, 0.66, 1.0][v] || 0;

function SymptomSlider({ field, value, onChange }) {
  return (
    <div className="simple-slider">
      <div className="simple-slider-label">{field.label}</div>
      {field.hint && <div className="simple-slider-hint">{field.hint}</div>}
      <div className="simple-slider-options">
        {LEVEL_LABELS.map((l, i) => (
          <button key={i} type="button"
            className={`level-btn ${value === i ? 'active' : ''}`}
            onClick={() => onChange(field.key, i)}>
            <span className="level-emoji">{i === 0 ? '✅' : i === 1 ? '🟡' : i === 2 ? '🟠' : '🔴'}</span>
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
        <div style={{ width: `${factor.score_percent}%`, background: statusColor, height: 6, borderRadius: 4, transition: 'width 0.4s' }} />
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

function StageResult({ stageResult }) {
  const [showFactors, setShowFactors] = useState(false);
  if (!stageResult) return null;
  const r = stageResult;
  const report = r.aiDetail?.detailed_report;
  const isInfected = r.result === 'positive';

  const actionColor = r.aiDetail?.action === 'vet_review_required' ? '#e53e3e'
    : r.aiDetail?.action === 'postpone_and_treat' ? '#d69e2e' : '#38a169';

  return (
    <div className={`card result-card ${r.result}`} style={{ marginTop: 0 }}>
      {r.blocked ? (
        <>
          <div className="result-icon">🚫</div>
          <h3>Invalid Photo</h3>
          <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{r.error}</div>
          <div className="action-box warning"><p>📷 {r.action}</p></div>
        </>
      ) : (
        <>
          {/* Verdict */}
          <div className="result-status-big">
            <div className={isInfected ? 'status-positive' : 'status-negative'}>
              <div className="status-emoji">{isInfected ? '🔴' : '✅'}</div>
              <div className="status-text">{isInfected ? 'Infection Suspected!' : 'No Infection Detected'}</div>
              <div className="status-sub" style={{ color: actionColor, fontWeight: 700 }}>
                {r.aiDetail?.action_label || ''}
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className="confidence-simple">
            <div className="conf-label">AI Confidence</div>
            <div className="conf-meter">
              <div className="conf-fill" style={{
                width: `${r.confidence}%`,
                background: r.confidence > 70 ? '#e53e3e' : r.confidence > 50 ? '#d69e2e' : '#38a169'
              }} />
            </div>
            <div className="conf-value">{r.confidence}%
              <span className="conf-word">
                {r.confidence > 80 ? ' (High Risk)' : r.confidence > 60 ? ' (Moderate Risk)' : ' (Low Risk)'}
              </span>
            </div>
          </div>

          {/* Dominant symptoms */}
          {r.aiDetail?.dominant_symptoms?.length > 0 && (
            <div style={{ margin: '8px 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Key symptoms: </span>
              {r.aiDetail.dominant_symptoms.map((s, i) => (
                <span key={i} style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 4,
                  padding: '2px 8px', fontSize: 12, color: '#c53030' }}>{s}</span>
              ))}
            </div>
          )}

          {/* Summary */}
          {report?.summary && (
            <div style={{ background: isInfected ? '#fff5f5' : '#f0fff4', border: `1px solid ${isInfected ? '#feb2b2' : '#9ae6b4'}`,
              borderRadius: 8, padding: '10px 14px', margin: '10px 0', fontSize: 13, fontWeight: 600,
              color: isInfected ? '#c53030' : '#276749' }}>
              {report.summary}
            </div>
          )}

          {/* Factor breakdown */}
          {report?.factors?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setShowFactors(v => !v)}
                style={{ background: 'none', border: '1px solid #cbd5e0', borderRadius: 6, padding: '6px 12px',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2d3748', width: '100%', textAlign: 'left' }}>
                {showFactors ? '▲' : '▼'} &nbsp;
                📊 Detailed Factor Report — {report.positive_factors} high / {report.moderate_factors} moderate / {report.negative_factors} normal out of {report.total_factors} factors
              </button>
              {showFactors && (
                <div style={{ marginTop: 10 }}>
                  {report.factors.map(f => <FactorRow key={f.factor_number} factor={f} />)}
                </div>
              )}
            </div>
          )}

          {/* Action box */}
          {isInfected && (
            <div className="action-box warning" style={{ marginTop: 10 }}>
              <p>⚠️ Do NOT proceed with artificial insemination</p>
              <p>🏥 Consult a veterinarian immediately</p>
              <p>💊 Treatment required before next AI attempt</p>
            </div>
          )}
          {!isInfected && (
            <div className="action-box" style={{ marginTop: 10, background: '#f0fff4', border: '1px solid #9ae6b4' }}>
              <p>✅ Animal appears healthy — safe to proceed with AI</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function InfectionDetection() {
  const [animals, setAnimals]   = useState([]);
  const [selectedAnimal, setSelected] = useState(null);
  const [activeStage, setActiveStage] = useState('csv');
  const [results, setResults]   = useState({ csv: null, photo: null, combined: null });
  const [loadingStage, setLoadingStage] = useState(null);
  const [image, setImage]       = useState(null);
  const [form, setForm] = useState({
    animalId: '',
    abnormalDischarge: 0, purulentDischarge: 0, swellingOrLesion: 0,
    fever: 0, bloodContamination: 0, foulSmell: 0, repeatAiFailureHistory: 0,
  });

  useEffect(() => {
    api.get('/animals').then(r => {
      setAnimals(r.data);
      if (r.data.length > 0) {
        setForm(f => ({ ...f, animalId: r.data[0]._id }));
        setSelected(r.data[0]);
      }
    });
  }, []);

  const handleAnimalChange = (id) => {
    const a = animals.find(x => x._id === id);
    setSelected(a || null);
    setForm(f => ({ ...f, animalId: id }));
    setResults({ csv: null, photo: null, combined: null });
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const runStage = async (stage) => {
    if (!form.animalId) return toast.error('Please select an animal');
    if (stage === 'photo' && !image) return toast.error('Please upload a photo for photo analysis');
    if (stage === 'combined' && !image) return toast.error('Please upload a photo for combined analysis');

    setLoadingStage(stage);
    try {
      const fd = new FormData();
      fd.append('animalId', form.animalId);
      fd.append('stage', stage);
      SYMPTOM_FIELDS.forEach(f => fd.append(f.key, toFloat(form[f.key])));
      if (image && stage !== 'csv') fd.append('image', image);

      const { data } = await api.post('/predictions/infection', fd);
      setResults(prev => ({ ...prev, [stage]: data }));
      toast.success(`Step ${STAGES.findIndex(s => s.key === stage) + 1} health analysis complete!`);
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
        <h2>🔬 Health & Infection Check</h2>
        <p>3-Stage AI Reproductive Health Screening — Karnataka Govt Jeeva</p>
      </div>

      {/* Input form */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Animal & Symptom Assessment</h3>
        <div className="form-group">
          <label>Select Animal *</label>
          <select value={form.animalId} onChange={e => handleAnimalChange(e.target.value)} required>
            <option value="">-- Select animal --</option>
            {animals.map(a => (
              <option key={a._id} value={a._id}>
                {SPECIES_EMOJI[a.species] || '🐾'} {a.tagId} — {a.name || a.species} ({a.species})
              </option>
            ))}
          </select>
          {selectedAnimal && (
            <div className="selected-animal-info">
              {SPECIES_EMOJI[selectedAnimal.species] || '🐾'} {selectedAnimal.species} |
              {selectedAnimal.breed || 'Unknown breed'} |
              Age: {selectedAnimal.age || '?'} yrs | Weight: {selectedAnimal.weight || '?'} kg
            </div>
          )}
        </div>

        {SYMPTOM_FIELDS.map(f => (
          <SymptomSlider key={f.key} field={f} value={form[f.key]} onChange={set} />
        ))}

        <ImageCapture
          label="📷 Photo of Affected Area — discharge / swelling / lesion (required for Step 2 & 3)"
          onCapture={setImage}
        />

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
          const isInfected = r?.result === 'positive';
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
              <div style={{ fontSize: 11, opacity: 0.85 }}>{s.key === 'csv' ? 'Symptoms' : s.key === 'photo' ? 'Photo' : 'Combined'}</div>
              {done && (
                <div style={{ fontSize: 11, marginTop: 2, color: activeStage === s.key ? '#fff' : (isInfected ? '#e53e3e' : '#38a169'), fontWeight: 700 }}>
                  {isInfected ? '🔴 Infected' : '✅ Healthy'} — {r.confidence}%
                </div>
              )}
              {loadingStage === s.key && <div style={{ fontSize: 11, marginTop: 2 }}>🔄 Analyzing...</div>}
            </button>
          );
        })}
      </div>

      {/* Per-stage run buttons */}
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
      <StageResult stageResult={results[activeStage]} />

      {/* Comparison table when all 3 done */}
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
                <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {STAGES.map((s, idx) => {
                const r = results[s.key];
                if (!r || r.blocked) return null;
                const report = r.aiDetail?.detailed_report;
                const isInfected = r.result === 'positive';
                const actionColor = r.aiDetail?.action === 'vet_review_required' ? '#e53e3e'
                  : r.aiDetail?.action === 'postpone_and_treat' ? '#d69e2e' : '#38a169';
                return (
                  <tr key={s.key} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.icon} Step {idx + 1}: {s.key === 'csv' ? 'Symptoms' : s.key === 'photo' ? 'Photo' : 'Combined'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: isInfected ? '#e53e3e' : '#38a169' }}>
                      {isInfected ? '🔴 INFECTED' : '✅ HEALTHY'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ background: '#e2e8f0', borderRadius: 4, height: 8, width: 80, margin: '0 auto 2px' }}>
                        <div style={{ width: `${r.confidence}%`, height: 8, borderRadius: 4,
                          background: r.confidence > 70 ? '#e53e3e' : r.confidence > 50 ? '#d69e2e' : '#38a169' }} />
                      </div>
                      {r.confidence}%
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12 }}>
                      {report ? `${report.positive_factors}🔴 ${report.moderate_factors}⚠️ ${report.negative_factors}✅ / ${report.total_factors}` : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: actionColor }}>
                      {r.aiDetail?.action_label || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 10, padding: '10px 12px', background: '#ebf8ff', borderRadius: 8, fontSize: 13, color: '#2b6cb0' }}>
            <strong>Final Recommendation:</strong>{' '}
            {results.combined.result === 'positive'
              ? `🔴 Infection confirmed by combined analysis (${results.combined.confidence}% confidence). ${results.combined.aiDetail?.action_label || 'Consult veterinarian immediately.'}`
              : `✅ No infection detected by combined analysis (${results.combined.confidence}% confidence). Animal is safe to proceed with AI.`}
          </div>
        </div>
      )}
    </div>
  );
}
