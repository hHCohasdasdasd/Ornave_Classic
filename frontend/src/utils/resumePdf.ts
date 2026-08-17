import jsPDF from 'jspdf';
import { WorkProfile } from '@/services/workSuiteService';

const MARGIN = 18;
const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function dateRangeLabel(startDate?: string, endDate?: string, current?: boolean): string {
  if (!startDate && !endDate) return '';
  const start = startDate || '?';
  const end = current ? 'Present' : (endDate || '?');
  return `${start} – ${end}`;
}

/**
 * Renders a Work Profile as a simple, single-column resume PDF and triggers
 * a browser download. Client-side generation (jsPDF) rather than a backend
 * render — no server dependency, and this data never needs to leave the
 * browser to become a PDF.
 */
export function downloadResumePdf(profile: WorkProfile, fullName: string, email: string): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const writeWrapped = (text: string, fontSize: number, lineHeight: number, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    const lines: string[] = doc.splitTextToSize(text, CONTENT_WIDTH);
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, MARGIN, y);
      y += lineHeight;
    }
  };

  // Header: name, headline, email
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(fullName, MARGIN, y);
  y += 8;

  if (profile.headline) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(90);
    doc.text(profile.headline, MARGIN, y);
    y += 6;
  }

  doc.setFontSize(9.5);
  doc.setTextColor(120);
  doc.text(email, MARGIN, y);
  doc.setTextColor(20);
  y += 8;

  doc.setDrawColor(200);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;

  if (profile.summary) {
    writeWrapped(profile.summary, 10.5, 5);
    y += 4;
  }

  const sectionHeader = (label: string) => {
    ensureSpace(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(30);
    doc.text(label.toUpperCase(), MARGIN, y);
    y += 2;
    doc.setDrawColor(210);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 6;
  };

  if (profile.experience.length > 0) {
    sectionHeader('Experience');
    for (const exp of profile.experience) {
      ensureSpace(6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20);
      doc.text(exp.title || 'Untitled role', MARGIN, y);

      const range = dateRangeLabel(exp.startDate, exp.endDate, exp.current);
      if (range) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(120);
        doc.text(range, PAGE_WIDTH - MARGIN, y, { align: 'right' });
      }
      y += 5.5;

      if (exp.company) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(90);
        doc.text(exp.company, MARGIN, y);
        y += 5.5;
      }

      if (exp.description) {
        doc.setTextColor(50);
        writeWrapped(exp.description, 9.5, 4.6);
      }
      y += 4;
    }
  }

  if (profile.education.length > 0) {
    sectionHeader('Education');
    for (const edu of profile.education) {
      ensureSpace(6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20);
      doc.text(edu.school || 'Untitled school', MARGIN, y);

      const range = dateRangeLabel(edu.startDate, edu.endDate);
      if (range) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(120);
        doc.text(range, PAGE_WIDTH - MARGIN, y, { align: 'right' });
      }
      y += 5.5;

      if (edu.degree) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(90);
        doc.text(edu.degree, MARGIN, y);
        y += 5.5;
      }
      y += 3;
    }
  }

  if (profile.skills.length > 0) {
    sectionHeader('Skills');
    doc.setTextColor(50);
    writeWrapped(profile.skills.join('  ·  '), 10, 5);
  }

  const filenameSafeName = fullName.trim().replace(/\s+/g, '_') || 'resume';
  doc.save(`${filenameSafeName}_resume.pdf`);
}
