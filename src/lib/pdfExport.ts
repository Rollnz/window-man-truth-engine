import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface FunnelData {
  traffic: number;
  engagement: number;
  leadGen: number;
  conversion: number;
}

interface SummaryData {
  totalLeads: number;
  totalEmails: number;
  totalAiInteractions: number;
}

interface AttributionEvent {
  id: string;
  event_name: string;
  event_category: string | null;
  event_data: Record<string, unknown> | null;
  page_path: string | null;
  created_at: string;
  session_id: string;
}

interface ExportData {
  summary: SummaryData;
  funnel: FunnelData;
  events: AttributionEvent[];
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
}

export function generateAttributionPDF(data: ExportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Helper for centered text
  const centerText = (text: string, y: number, fontSize = 12) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // Helper for left-aligned text
  const leftText = (text: string, y: number, fontSize = 10) => {
    doc.setFontSize(fontSize);
    doc.text(text, 20, y);
  };

  // Title
  doc.setFont('helvetica', 'bold');
  centerText('Attribution Dashboard Report', yPos, 18);
  yPos += 10;

  // Date range
  doc.setFont('helvetica', 'normal');
  const dateRangeText = data.dateRange.startDate && data.dateRange.endDate
    ? `${format(data.dateRange.startDate, 'MMM d, yyyy')} - ${format(data.dateRange.endDate, 'MMM d, yyyy')}`
    : 'All time';
  centerText(`Report Period: ${dateRangeText}`, yPos, 10);
  yPos += 5;
  centerText(`Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, yPos, 10);
  yPos += 15;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // Executive Summary Section
  doc.setFont('helvetica', 'bold');
  leftText('EXECUTIVE SUMMARY', yPos, 14);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  leftText(`• Total Leads: ${data.summary.totalLeads.toLocaleString()}`, yPos);
  yPos += 7;
  leftText(`• Email Reports Sent: ${data.summary.totalEmails.toLocaleString()}`, yPos);
  yPos += 7;
  leftText(`• AI Interactions: ${data.summary.totalAiInteractions.toLocaleString()}`, yPos);
  yPos += 15;

  // Conversion Funnel Section
  doc.setFont('helvetica', 'bold');
  leftText('CONVERSION FUNNEL', yPos, 14);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  
  // Calculate percentages
  const engagementRate = data.funnel.traffic > 0 
    ? ((data.funnel.engagement / data.funnel.traffic) * 100).toFixed(1) 
    : '0';
  const leadRate = data.funnel.engagement > 0 
    ? ((data.funnel.leadGen / data.funnel.engagement) * 100).toFixed(1) 
    : '0';
  const conversionRate = data.funnel.leadGen > 0 
    ? ((data.funnel.conversion / data.funnel.leadGen) * 100).toFixed(1) 
    : '0';
  const overallRate = data.funnel.traffic > 0 
    ? ((data.funnel.conversion / data.funnel.traffic) * 100).toFixed(2) 
    : '0';

  leftText(`Traffic (Unique Sessions): ${data.funnel.traffic.toLocaleString()}`, yPos);
  yPos += 7;
  leftText(`Engagement (Tool/Vault): ${data.funnel.engagement.toLocaleString()} (${engagementRate}% of traffic)`, yPos);
  yPos += 7;
  leftText(`Lead Generation: ${data.funnel.leadGen.toLocaleString()} (${leadRate}% of engaged)`, yPos);
  yPos += 7;
  leftText(`Consultations Booked: ${data.funnel.conversion.toLocaleString()} (${conversionRate}% of leads)`, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  leftText(`Overall Conversion Rate: ${overallRate}%`, yPos);
  yPos += 15;

  // Divider
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // Recent Events Section
  doc.setFont('helvetica', 'bold');
  leftText('RECENT EVENTS (Top 25)', yPos, 14);
  yPos += 10;

  // Table header
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Timestamp', 20, yPos);
  doc.text('Event', 55, yPos);
  doc.text('Page', 110, yPos);
  doc.text('Session ID', 150, yPos);
  yPos += 5;

  // Table rows
  doc.setFont('helvetica', 'normal');
  const maxEvents = Math.min(data.events.length, 25);
  
  for (let i = 0; i < maxEvents; i++) {
    const event = data.events[i];
    
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    const timestamp = format(new Date(event.created_at), 'MM/dd HH:mm');
    const eventName = event.event_name.replace(/_/g, ' ').substring(0, 20);
    const pagePath = (event.page_path || '—').substring(0, 25);
    const sessionId = event.session_id.substring(0, 8) + '...';

    doc.text(timestamp, 20, yPos);
    doc.text(eventName, 55, yPos);
    doc.text(pagePath, 110, yPos);
    doc.text(sessionId, 150, yPos);
    yPos += 5;
  }

  if (data.events.length > 25) {
    yPos += 5;
    doc.setFont('helvetica', 'italic');
    leftText(`... and ${data.events.length - 25} more events (see CSV export for full data)`, yPos, 8);
  }

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  centerText('Window Truth Engine - Attribution Report', yPos);

  // Save the PDF
  const fileName = `attribution-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(fileName);
}
