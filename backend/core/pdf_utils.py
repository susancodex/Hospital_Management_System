from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from datetime import datetime


def generate_invoice_pdf(billing):
    """Generate a PDF invoice for a billing record."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=30,
        alignment=TA_CENTER,
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=10,
    )
    
    # Title
    elements.append(Paragraph("HOSPITAL INVOICE", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Hospital info
    elements.append(Paragraph("AetherCare Hospital Management System", heading_style))
    elements.append(Paragraph(f"Invoice #: {billing.id}", styles['Normal']))
    elements.append(Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d')}", styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Patient info
    elements.append(Paragraph("PATIENT INFORMATION", heading_style))
    patient_data = [
        ['Name:', billing.patient.full_name],
        ['MRN:', billing.patient.mrn or 'N/A'],
        ['Email:', billing.patient.email or 'N/A'],
        ['Phone:', billing.patient.phone or 'N/A'],
    ]
    patient_table = Table(patient_data, colWidths=[2*inch, 4*inch])
    patient_table.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
        ('FONT', (1, 0), (1, -1), 'Helvetica', 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#475569')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
    ]))
    elements.append(patient_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Billing details
    elements.append(Paragraph("BILLING DETAILS", heading_style))
    billing_data = [
        ['Description:', billing.description or 'Medical Services'],
        ['Amount:', f'${billing.amount:.2f}'],
        ['Paid:', f'${billing.paid_amount:.2f}'],
        ['Balance Due:', f'${billing.balance_due:.2f}'],
        ['Status:', billing.get_status_display()],
        ['Due Date:', str(billing.due_date) if billing.due_date else 'Not specified'],
    ]
    if billing.insurance_provider:
        billing_data.append(['Insurance:', billing.insurance_provider])
    if billing.insurance_claim_number:
        billing_data.append(['Claim #:', billing.insurance_claim_number])
    
    billing_table = Table(billing_data, colWidths=[2*inch, 4*inch])
    billing_table.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
        ('FONT', (1, 0), (1, -1), 'Helvetica', 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#475569')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
    ]))
    elements.append(billing_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#94a3b8'),
        alignment=TA_CENTER,
    )
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("Thank you for your business. Please make payments according to the terms specified.", footer_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_medical_report_pdf(report):
    """Generate a PDF for a medical report."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=20,
        alignment=TA_CENTER,
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=10,
        spaceBefore=10,
    )
    
    # Title
    elements.append(Paragraph("MEDICAL REPORT", title_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Report header
    header_data = [
        ['Title:', report.title],
        ['Type:', report.get_report_type_display()],
        ['Status:', report.get_status_display()],
        ['Date:', report.created_at.strftime('%Y-%m-%d')],
    ]
    header_table = Table(header_data, colWidths=[1.5*inch, 4.5*inch])
    header_table.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
        ('FONT', (1, 0), (1, -1), 'Helvetica', 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#475569')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Patient info
    elements.append(Paragraph("PATIENT INFORMATION", heading_style))
    patient_data = [
        ['Name:', report.patient.full_name],
        ['MRN:', report.patient.mrn or 'N/A'],
    ]
    if report.doctor:
        patient_data.append(['Physician:', report.doctor.full_name])
    patient_table = Table(patient_data, colWidths=[1.5*inch, 4.5*inch])
    patient_table.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
        ('FONT', (1, 0), (1, -1), 'Helvetica', 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#475569')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
    ]))
    elements.append(patient_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Summary
    if report.summary:
        elements.append(Paragraph("SUMMARY", heading_style))
        elements.append(Paragraph(report.summary, styles['Normal']))
        elements.append(Spacer(1, 0.15*inch))
    
    # Findings
    if report.findings:
        elements.append(Paragraph("FINDINGS", heading_style))
        elements.append(Paragraph(report.findings, styles['Normal']))
        elements.append(Spacer(1, 0.15*inch))
    
    # Recommendations
    if report.recommendations:
        elements.append(Paragraph("RECOMMENDATIONS", heading_style))
        elements.append(Paragraph(report.recommendations, styles['Normal']))
        elements.append(Spacer(1, 0.15*inch))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#94a3b8'),
        alignment=TA_CENTER,
    )
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph(f"Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", footer_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
