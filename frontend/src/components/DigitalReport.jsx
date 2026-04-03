import { useLang } from '../context/LanguageContext';

export default function DigitalReport({ report, onClose }) {
  const { lang } = useLang();

  const handlePrint = () => window.print();

  const L = {
    title:        lang==='kn'?'ಪಶು ಆರೋಗ್ಯ ಮತ್ತು ಸೇವಾ ವರದಿ':lang==='hi'?'पशु स्वास्थ्य एवं सेवा रिपोर्ट':'Animal Health & Service Report',
    issued:       lang==='kn'?'ನೀಡಿದ ದಿನಾಂಕ':lang==='hi'?'जारी तारीख':'Issued Date',
    valid:        lang==='kn'?'ಮಾನ್ಯ ವರೆಗೆ':lang==='hi'?'वैध तक':'Valid Until',
    farmer:       lang==='kn'?'ರೈತರ ವಿವರ':lang==='hi'?'किसान विवरण':'Farmer Details',
    animal:       lang==='kn'?'ಪ್ರಾಣಿ ವಿವರ':lang==='hi'?'पशु विवरण':'Animal Details',
    service:      lang==='kn'?'ಸೇವೆ ವಿವರ':lang==='hi'?'सेवा विवरण':'Service Details',
    findings:     lang==='kn'?'ತಪಾಸಣೆ ಫಲಿತಾಂಶ':lang==='hi'?'जांच निष्कर्ष':'Examination Findings',
    diagnosis:    lang==='kn'?'ರೋಗ ನಿರ್ಣಯ':lang==='hi'?'निदान':'Diagnosis',
    prescription: lang==='kn'?'ಔಷಧ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್':lang==='hi'?'दवा पर्चा':'Prescription',
    followUp:     lang==='kn'?'ಮುಂದಿನ ಭೇಟಿ':lang==='hi'?'अगली मुलाकात':'Follow-up',
    centre:       lang==='kn'?'AI ಕೇಂದ್ರ ವಿವರ':lang==='hi'?'AI केंद्र विवरण':'AI Centre Details',
    technician:   lang==='kn'?'ತಂತ್ರಜ್ಞ':lang==='hi'?'तकनीशियन':'Technician',
    govtNote:     lang==='kn'?'ಈ ವರದಿ ಕರ್ನಾಟಕ ಸರ್ಕಾರದ Jeeva ಪ್ರಣಾಳಿಕೆ ಮೂಲಕ ಡಿಜಿಟಲ್ ಆಗಿ ಪ್ರಮಾಣೀಕರಿಸಲಾಗಿದೆ':
                  lang==='hi'?'यह रिपोर्ट कर्नाटक सरकार के Jeeva पोर्टल के माध्यम से डिजिटल रूप से प्रमाणित है':
                  'This report is digitally certified through Karnataka Govt Jeeva Portal',
    print:        lang==='kn'?'ಮುದ್ರಿಸಿ':lang==='hi'?'प्रिंट करें':'Print / Download',
    close:        lang==='kn'?'ಮುಚ್ಚಿ':lang==='hi'?'बंद करें':'Close',
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '—';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>

        {/* Action buttons — hidden on print */}
        <div className="report-actions no-print">
          <button className="btn-primary" onClick={handlePrint}>🖨️ {L.print}</button>
          <button className="btn-secondary" onClick={onClose}>{L.close}</button>
        </div>

        {/* Printable report */}
        <div className="report-document" id="report-print">

          {/* Header */}
          <div className="report-header">
            <div className="report-govt-logo">
              <div className="govt-emblem">🏛️</div>
              <div>
                <div className="report-govt-name">Government of Karnataka</div>
                <div className="report-dept">Department of Animal Husbandry & Veterinary Services</div>
                <div className="report-portal">Jeeva — ಜೀವ Digital Portal</div>
              </div>
            </div>
            <div className="report-meta">
              <div className="report-number">Report No: <strong>{report.reportNumber}</strong></div>
              <div className="report-date">{L.issued}: {fmt(report.issuedAt)}</div>
              <div className="report-valid">{L.valid}: {fmt(report.validUntil)}</div>
              <div className="report-verified">✅ Digitally Verified</div>
            </div>
          </div>

          <div className="report-title">{L.title}</div>

          {/* Two column layout */}
          <div className="report-cols">
            {/* Farmer details */}
            <div className="report-section">
              <div className="report-section-title">👨🌾 {L.farmer}</div>
              <table className="report-table">
                <tbody>
                  <tr><td>{lang==='kn'?'ಹೆಸರು':lang==='hi'?'नाम':'Name'}</td><td><strong>{report.farmer?.name}</strong></td></tr>
                  <tr><td>{lang==='kn'?'ಮೊಬೈಲ್':lang==='hi'?'मोबाइल':'Mobile'}</td><td>{report.farmer?.phone}</td></tr>
                  <tr><td>{lang==='kn'?'ಗ್ರಾಮ':lang==='hi'?'गांव':'Village'}</td><td>{report.farmer?.village}, {report.farmer?.taluk}</td></tr>
                  <tr><td>{lang==='kn'?'ಜಿಲ್ಲೆ':lang==='hi'?'जिला':'District'}</td><td>{report.farmer?.district}</td></tr>
                  {report.farmer?.aadhaarNumber && <tr><td>Aadhaar</td><td>XXXX-XXXX-{report.farmer.aadhaarNumber.slice(-4)}</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Animal details */}
            <div className="report-section">
              <div className="report-section-title">🐄 {L.animal}</div>
              <table className="report-table">
                <tbody>
                  <tr><td>Tag ID</td><td><strong>{report.animal?.tagId}</strong></td></tr>
                  <tr><td>{lang==='kn'?'ಹೆಸರು':lang==='hi'?'नाम':'Name'}</td><td>{report.animal?.name || '—'}</td></tr>
                  <tr><td>{lang==='kn'?'ಜಾತಿ':lang==='hi'?'प्रजाति':'Species'}</td><td>{report.animal?.species}</td></tr>
                  <tr><td>{lang==='kn'?'ತಳಿ':lang==='hi'?'नस्ल':'Breed'}</td><td>{report.animal?.breed || '—'}</td></tr>
                  <tr><td>{lang==='kn'?'ವಯಸ್ಸು':lang==='hi'?'उम्र':'Age'}</td><td>{report.animal?.age || '—'} {lang==='kn'?'ವರ್ಷ':lang==='hi'?'साल':'yrs'}</td></tr>
                  <tr><td>{lang==='kn'?'ತೂಕ':lang==='hi'?'वजन':'Weight'}</td><td>{report.animal?.weight || '—'} kg</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Service details */}
          <div className="report-section">
            <div className="report-section-title">🏥 {L.service}</div>
            <table className="report-table">
              <tbody>
                <tr><td>{lang==='kn'?'ಸೇವೆ ಪ್ರಕಾರ':lang==='hi'?'सेवा प्रकार':'Service Type'}</td>
                    <td><strong>{report.serviceType?.replace(/_/g,' ').toUpperCase()}</strong></td></tr>
                <tr><td>{lang==='kn'?'ದಿನಾಂಕ':lang==='hi'?'तारीख':'Date'}</td>
                    <td>{fmt(report.appointment?.appointmentDate)}</td></tr>
                <tr><td>{L.technician}</td><td>{report.technicianName || '—'}</td></tr>
                {report.technicianId && <tr><td>Technician ID</td><td>{report.technicianId}</td></tr>}
                {report.semenBatchNo && <tr><td>Semen Batch No.</td><td>{report.semenBatchNo}</td></tr>}
                {report.bullBreed && <tr><td>Bull Breed</td><td>{report.bullBreed}</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Findings & Diagnosis */}
          {(report.findings || report.diagnosis) && (
            <div className="report-section">
              <div className="report-section-title">🔬 {L.findings} & {L.diagnosis}</div>
              {report.findings && <div className="report-text-block"><strong>{L.findings}:</strong> {report.findings}</div>}
              {report.diagnosis && <div className="report-text-block"><strong>{L.diagnosis}:</strong> {report.diagnosis}</div>}
            </div>
          )}

          {/* Prescription */}
          {report.prescription?.length > 0 && (
            <div className="report-section">
              <div className="report-section-title">💊 {L.prescription}</div>
              <table className="report-table prescription-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{lang==='kn'?'ಔಷಧ':lang==='hi'?'दवा':'Medicine'}</th>
                    <th>{lang==='kn'?'ಡೋಸ್':lang==='hi'?'खुराक':'Dose'}</th>
                    <th>{lang==='kn'?'ಅವಧಿ':lang==='hi'?'अवधि':'Duration'}</th>
                    <th>{lang==='kn'?'ಸೂಚನೆ':lang==='hi'?'निर्देश':'Instructions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.prescription.map((p, i) => (
                    <tr key={i}>
                      <td>{i+1}</td>
                      <td><strong>{p.medicine}</strong></td>
                      <td>{p.dose}</td>
                      <td>{p.duration}</td>
                      <td>{p.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Follow-up */}
          {(report.followUpDate || report.followUpNotes) && (
            <div className="report-section">
              <div className="report-section-title">📅 {L.followUp}</div>
              {report.followUpDate && <div className="report-text-block">{lang==='kn'?'ಮುಂದಿನ ಭೇಟಿ ದಿನಾಂಕ':lang==='hi'?'अगली मुलाकात तारीख':'Next Visit'}: <strong>{fmt(report.followUpDate)}</strong></div>}
              {report.followUpNotes && <div className="report-text-block">{report.followUpNotes}</div>}
            </div>
          )}

          {/* Centre details */}
          <div className="report-section">
            <div className="report-section-title">🏥 {L.centre}</div>
            <table className="report-table">
              <tbody>
                <tr><td>{lang==='kn'?'ಕೇಂದ್ರ ಹೆಸರು':lang==='hi'?'केंद्र नाम':'Centre Name'}</td><td><strong>{report.aiCentre?.centreName}</strong></td></tr>
                <tr><td>Centre Code</td><td>{report.aiCentre?.centreCode}</td></tr>
                <tr><td>License No.</td><td>{report.aiCentre?.licenseNumber}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Payment */}
          {report.serviceCharge > 0 && (
            <div className="report-section">
              <div className="report-section-title">💰 {lang==='kn'?'ಶುಲ್ಕ ವಿವರ':lang==='hi'?'शुल्क विवरण':'Payment Details'}</div>
              <table className="report-table">
                <tbody>
                  <tr><td>{lang==='kn'?'ಸೇವಾ ಶುಲ್ಕ':lang==='hi'?'सेवा शुल्क':'Service Charge'}</td><td><strong>₹{report.serviceCharge}</strong></td></tr>
                  <tr><td>{lang==='kn'?'ಪಾವತಿ ಸ್ಥಿತಿ':lang==='hi'?'भुगतान स्थिति':'Payment Status'}</td>
                      <td><span className={`badge ${report.paymentStatus==='paid'?'green':report.paymentStatus==='pending'?'orange':'blue'}`}>{report.paymentStatus}</span></td></tr>
                  {report.paymentId && <tr><td>Payment ID</td><td>{report.paymentId}</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* Govt seal footer */}
          <div className="report-footer">
            <div className="report-seal">
              <div className="seal-circle">
                <div className="seal-text">GOVT OF KARNATAKA</div>
                <div className="seal-sub">JEEVA</div>
                <div className="seal-year">2025</div>
              </div>
            </div>
            <div className="report-footer-text">
              <div className="report-verified-text">✅ {L.govtNote}</div>
              <div className="report-qr-note">Report No: {report.reportNumber} | Verify at: jeeva.karnataka.gov.in</div>
            </div>
            <div className="report-signature">
              <div className="sig-line"></div>
              <div className="sig-name">{report.technicianName}</div>
              <div className="sig-title">{lang==='kn'?'ಅಧಿಕೃತ ತಂತ್ರಜ್ಞ':lang==='hi'?'अधिकृत तकनीशियन':'Authorised Technician'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
