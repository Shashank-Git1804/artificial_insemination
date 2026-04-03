import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useLang } from '../../context/LanguageContext';

const SPECIES_EMOJI = { cow:'🐄', buffalo:'🐃', goat:'🐐', sheep:'🐑', pig:'🐷' };

export default function AnimalHistory() {
  const { t, lang } = useLang();
  const [animals, setAnimals]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    api.get('/animals').then(r => {
      setAnimals(r.data);
      if (r.data.length > 0) loadHistory(r.data[0]);
    });
  }, []);

  const loadHistory = async (animal) => {
    setSelected(animal);
    setLoading(true);
    try {
      const { data } = await api.get(`/predictions/animal/${animal._id}`);
      setPredictions(data);
    } catch { setPredictions([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>📋 {t('history')}</h2>
        <p>{lang === 'kn' ? 'ಪ್ರಾಣಿಯ AI ತಪಾಸಣೆ ಇತಿಹಾಸ' : lang === 'hi' ? 'पशु की AI जांच का इतिहास' : 'Animal AI check history'}</p>
      </div>

      {/* Animal selector */}
      <div className="animals-grid" style={{ marginBottom: '20px' }}>
        {animals.map(a => (
          <div key={a._id}
            className={`animal-card ${selected?._id === a._id ? 'selected-animal' : ''}`}
            onClick={() => loadHistory(a)}
            style={{ cursor: 'pointer' }}>
            <div className="animal-img">
              {a.imageUrl
                ? <img src={`http://localhost:5000${a.imageUrl}`} alt={a.name} />
                : <span className="animal-emoji">{SPECIES_EMOJI[a.species]}</span>}
            </div>
            <div className="animal-info">
              <div className="animal-tag">{a.tagId}</div>
              <div className="animal-name">{a.name || a.species}</div>
              <div className="animal-meta">
                <span>{SPECIES_EMOJI[a.species]} {a.species}</span>
                {a.breed && <span>• {a.breed}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* History for selected animal */}
      {selected && (
        <div className="card">
          <h3>
            {SPECIES_EMOJI[selected.species]} {selected.name || selected.tagId} —
            {lang === 'kn' ? ' ಇತಿಹಾಸ' : lang === 'hi' ? ' इतिहास' : ' History'}
          </h3>

          {loading && <p className="empty">{t('loading')}</p>}

          {!loading && predictions.length === 0 && (
            <p className="empty">
              {lang === 'kn' ? 'ಇನ್ನೂ ಯಾವುದೇ AI ತಪಾಸಣೆ ಇಲ್ಲ' :
               lang === 'hi' ? 'अभी कोई AI जांच नहीं' :
               'No AI checks done yet for this animal'}
            </p>
          )}

          <div className="prediction-list">
            {predictions.map(p => (
              <div key={p._id} className={`prediction-item ${p.result}`}
                style={{ padding: '14px', marginBottom: '8px', borderRadius: '8px',
                  background: p.result === 'positive' ? 'var(--danger-light)' : 'var(--primary-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>
                      {p.type === 'heat'
                        ? (lang === 'kn' ? '🌡️ ಗರ್ಭಧಾರಣೆ ತಪಾಸಣೆ' : lang === 'hi' ? '🌡️ गर्भाधान जांच' : '🌡️ Heat Check')
                        : (lang === 'kn' ? '🔬 ಆರೋಗ್ಯ ತಪಾಸಣೆ' : lang === 'hi' ? '🔬 स्वास्थ्य जांच' : '🔬 Health Check')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      📅 {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    {p.recommendation && (
                      <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text)' }}>
                        {p.recommendation.split('\n')[0]}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${p.result}`}>
                      {p.result === 'positive'
                        ? (lang === 'kn' ? '⚠️ ಪಾಸಿಟಿವ್' : lang === 'hi' ? '⚠️ पॉजिटिव' : '⚠️ Positive')
                        : (lang === 'kn' ? '✅ ನೆಗೆಟಿವ್' : lang === 'hi' ? '✅ नेगेटिव' : '✅ Negative')}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {t('confidence')}: {p.confidence}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
