import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ── Shared govt header ────────────────────────────────────────────────────────
function govtHeader(doc, title) {
  doc.setFillColor(26, 107, 60);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Government of Karnataka — Pashimitra', 105, 10, { align: 'center' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Department of Animal Husbandry & Veterinary Services', 105, 17, { align: 'center' });
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 220, 50);
  doc.text(title, 105, 25, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  return 36;
}

function govtFooter(doc) {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(26, 107, 60);
    doc.line(10, 285, 200, 285);
    doc.setFontSize(7); doc.setTextColor(120);
    doc.text(
      `Pashimitra Portal | Karnataka Govt | ${new Date().toLocaleDateString('en-IN')} | Page ${i}/${pages}`,
      105, 290, { align: 'center' }
    );
  }
}

// ── Export Service Report as PDF ──────────────────────────────────────────────
export function exportReportPDF(report, lang = 'en') {
  const doc = new jsPDF();
  const title = lang === 'kn' ? 'ಪಶು ಸೇವಾ ವರದಿ' : lang === 'hi' ? 'पशु सेवा रिपोर्ट' : 'Animal Service Report';
  let y = govtHeader(doc, title);

  // Report meta
  doc.setFontSize(8); doc.setTextColor(80);
  doc.text(`Report No: ${report.reportNumber}`, 14, y);
  doc.text(`Issued: ${new Date(report.issuedAt).toLocaleDateString('en-IN')}`, 90, y);
  doc.text(`Valid Until: ${new Date(report.validUntil).toLocaleDateString('en-IN')}`, 150, y);
  y += 7;

  // Farmer + Animal
  autoTable(doc, {
    startY: y,
    head: [['Farmer Details', '', 'Animal Details', '']],
    body: [
      ['Name', report.farmer?.name || '—', 'Tag ID', report.animal?.tagId || '—'],
      ['Phone', report.farmer?.phone || '—', 'Species', report.animal?.species || '—'],
      ['Village/District', `${report.farmer?.village || ''}, ${report.farmer?.district || ''}`, 'Breed', report.animal?.breed || '—'],
      ['Aadhaar', report.farmer?.aadhaarNumber ? `XXXX-${String(report.farmer.aadhaarNumber).slice(-4)}` : '—', 'Age / Weight', `${report.animal?.age || '?'} yr / ${report.animal?.weight || '?'} kg`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [26, 107, 60], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 35 } },
    margin: { left: 14 },
  });
  y = doc.lastAutoTable.finalY + 6;

  // Service
  autoTable(doc, {
    startY: y,
    head: [['Service Details', '']],
    body: [
      ['Service Type', (report.serviceType || '').replace(/_/g, ' ').toUpperCase()],
      ['Date', report.appointment?.appointmentDate ? new Date(report.appointment.appointmentDate).toLocaleDateString('en-IN') : '—'],
      ['Technician', report.technicianName || '—'],
      ['Technician ID', report.technicianId || '—'],
      ...(report.semenBatchNo ? [['Semen Batch No.', report.semenBatchNo]] : []),
      ...(report.bullBreed ? [['Bull Breed', report.bullBreed]] : []),
    ],
    theme: 'grid',
    headStyles: { fillColor: [21, 101, 192] },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    margin: { left: 14 },
  });
  y = doc.lastAutoTable.finalY + 6;

  // Findings
  if (report.findings || report.diagnosis) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 107, 60);
    doc.text('Examination Findings & Diagnosis', 14, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(0);
    if (report.findings) { doc.text(`Findings: ${report.findings}`, 14, y, { maxWidth: 182 }); y += 8; }
    if (report.diagnosis) { doc.text(`Diagnosis: ${report.diagnosis}`, 14, y, { maxWidth: 182 }); y += 8; }
  }

  // Prescription
  if (report.prescription?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(198, 40, 40);
    doc.text('Prescription', 14, y); y += 4;
    autoTable(doc, {
      startY: y,
      head: [['#', 'Medicine', 'Dose', 'Duration', 'Instructions']],
      body: report.prescription.map((p, i) => [i + 1, p.medicine, p.dose, p.duration, p.instructions || '—']),
      theme: 'striped',
      headStyles: { fillColor: [198, 40, 40] },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14 },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Follow-up
  if (report.followUpDate || report.followUpNotes) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(245, 127, 23);
    doc.text('Follow-up', 14, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(0);
    if (report.followUpDate) { doc.text(`Next Visit: ${new Date(report.followUpDate).toLocaleDateString('en-IN')}`, 14, y); y += 6; }
    if (report.followUpNotes) { doc.text(report.followUpNotes, 14, y, { maxWidth: 182 }); y += 8; }
  }

  // Centre
  autoTable(doc, {
    startY: y,
    head: [['AI Centre', '']],
    body: [
      ['Centre Name', report.aiCentre?.centreName || '—'],
      ['Centre Code', report.aiCentre?.centreCode || '—'],
      ['License No.', report.aiCentre?.licenseNumber || '—'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [106, 27, 154] },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    margin: { left: 14 },
  });

  // Govt seal
  const sy = doc.lastAutoTable.finalY + 8;
  doc.setFillColor(232, 245, 233);
  doc.rect(14, sy, 182, 16, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 107, 60);
  doc.text('DIGITALLY CERTIFIED — Government of Karnataka Pashimitra Portal', 105, sy + 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Verify: pashimitra.karnataka.gov.in | ${report.reportNumber}`, 105, sy + 12, { align: 'center' });

  govtFooter(doc);
  doc.save(`Pashimitra_Report_${report.reportNumber}.pdf`);
}

// ── Export Analytics as PDF ───────────────────────────────────────────────────
export function exportAnalyticsPDF(data, role, title = 'Analytics Report') {
  const doc = new jsPDF();
  let y = govtHeader(doc, title);

  doc.setFontSize(8); doc.setTextColor(80);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, y);
  y += 8;

  const tblOpts = (startY, head, body, color = [26, 107, 60]) => {
    autoTable(doc, {
      startY, head: [head], body,
      theme: 'striped',
      headStyles: { fillColor: color },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14 },
    });
    return doc.lastAutoTable.finalY + 8;
  };

  if (role === 'ai_centre') {
    y = tblOpts(y, ['Metric', 'Value'], [
      ['Total Farmers', data.totalFarmers ?? 0],
      ['Total Animals', data.totalAnimals ?? 0],
      ['Pending Appointments', data.pendingAppointments ?? 0],
      ['Completed Services', data.completedAppointments ?? 0],
    ]);
    if (data.animalsBySpecies?.length) {
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 107, 60);
      doc.text('Animals by Species', 14, y - 4);
      y = tblOpts(y, ['Species', 'Count'], data.animalsBySpecies.map(s => [s._id, s.count]));
    }
    if (data.farmersByDistrict?.length) {
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 107, 60);
      doc.text('Farmers by District', 14, y - 4);
      y = tblOpts(y, ['District', 'Farmers'], data.farmersByDistrict.map(d => [d._id || 'Unknown', d.count]), [21, 101, 192]);
    }
    if (data.appointmentsByService?.length) {
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 107, 60);
      doc.text('Appointments by Service', 14, y - 4);
      y = tblOpts(y, ['Service', 'Count'], data.appointmentsByService.map(s => [s._id?.replace(/_/g, ' '), s.count]), [106, 27, 154]);
    }
  } else {
    y = tblOpts(y, ['Metric', 'Value'], [
      ['Total Animals', data.totalAnimals ?? 0],
      ['Heat Detections', data.heatPositive ?? 0],
      ['Infection Alerts', data.infections ?? 0],
      ['Pending Appointments', data.pendingAppointments ?? 0],
    ]);
    if (data.animalsBySpecies?.length) {
      y = tblOpts(y, ['Species', 'Count'], data.animalsBySpecies.map(s => [s._id, s.count]));
    }
  }

  govtFooter(doc);
  doc.save(`Pashimitra_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── Export Analytics as Excel ─────────────────────────────────────────────────
export function exportAnalyticsExcel(data, role) {
  const wb = XLSX.utils.book_new();
  const addSheet = (name, rows) => {
    if (rows?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
  };

  if (role === 'ai_centre') {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Pashimitra — Karnataka Govt Analytics'],
      ['Generated', new Date().toLocaleDateString('en-IN')],
      [],
      ['Metric', 'Value'],
      ['Total Farmers', data.totalFarmers ?? 0],
      ['Total Animals', data.totalAnimals ?? 0],
      ['Pending Appointments', data.pendingAppointments ?? 0],
      ['Completed Services', data.completedAppointments ?? 0],
    ]), 'Summary');
    addSheet('Animals by Species', data.animalsBySpecies?.map(s => ({ Species: s._id, Count: s.count })));
    addSheet('Animals by Gender', data.animalsByGender?.map(g => ({ Gender: g._id, Count: g.count })));
    addSheet('Farmers by District', data.farmersByDistrict?.map(d => ({ District: d._id || 'Unknown', Farmers: d.count })));
    addSheet('Appointments by Service', data.appointmentsByService?.map(s => ({ Service: s._id?.replace(/_/g, ' '), Count: s.count })));
    addSheet('Monthly Registrations', data.farmersRegisteredMonthly?.map(m => ({ Year: m._id.year, Month: m._id.month, 'New Farmers': m.count })));
    addSheet('Heat by Species', data.heatBySpecies?.map(h => ({ Species: h._id, 'Heat Detections': h.count })));
  } else {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Pashimitra — Farmer Analytics'],
      ['Generated', new Date().toLocaleDateString('en-IN')],
      [],
      ['Metric', 'Value'],
      ['Total Animals', data.totalAnimals ?? 0],
      ['Heat Detections', data.heatPositive ?? 0],
      ['Infection Alerts', data.infections ?? 0],
      ['Pending Appointments', data.pendingAppointments ?? 0],
    ]), 'Summary');
    addSheet('Animals by Species', data.animalsBySpecies?.map(s => ({ Species: s._id, Count: s.count })));
    addSheet('Animals by Gender', data.animalsByGender?.map(g => ({ Gender: g._id, Count: g.count })));
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `Pashimitra_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportCSV(rows, filename) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');
  saveAs(new Blob([csv], { type: 'text/csv' }), `${filename}.csv`);
}
