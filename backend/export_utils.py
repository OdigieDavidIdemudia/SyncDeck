"""
Export utilities for generating CSV and PDF reports from task achievements
"""

import csv
import io
from datetime import datetime
from typing import List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT

def generate_csv(tasks: List[dict], username: str) -> str:
    """
    Generate CSV content from completed tasks
    
    Args:
        tasks: List of task dictionaries
        username: Name of the user for the report
        
    Returns:
        CSV content as string
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['Task Name', 'Completion Date', 'Criticality', 'Assigned By', 'Description'])
    
    # Write task data
    for task in tasks:
        completion_date = task.get('completed_at', '')
        if completion_date:
            completion_date = datetime.fromisoformat(completion_date.replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M')
        
        description = task.get('description', '')
        if description and len(description) > 100:
            description = description[:97] + '...'
        
        writer.writerow([
            task.get('title', ''),
            completion_date,
            task.get('criticality', '').upper(),
            task.get('assigner', {}).get('username', 'N/A'),
            description
        ])
    
    return output.getvalue()


def generate_pdf(tasks: List[dict], username: str, period: str = "month") -> bytes:
    """
    Generate PDF report from completed tasks
    
    Args:
        tasks: List of task dictionaries
        username: Name of the user for the report
        period: Time period for the report (week/month/all)
        
    Returns:
        PDF content as bytes
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#ea580c'),
        spaceAfter=12,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#6b7280'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    # Add title
    title = Paragraph(f"Achievement Report - {username}", title_style)
    elements.append(title)
    
    # Add subtitle with period and date
    period_text = period.capitalize() if period != "all" else "All Time"
    subtitle = Paragraph(
        f"{period_text} Report | Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')}",
        subtitle_style
    )
    elements.append(subtitle)
    elements.append(Spacer(1, 0.3*inch))
    
    # Add summary statistics
    total_tasks = len(tasks)
    high_priority = sum(1 for t in tasks if t.get('criticality') == 'high')
    medium_priority = sum(1 for t in tasks if t.get('criticality') == 'medium')
    low_priority = sum(1 for t in tasks if t.get('criticality') == 'low')
    
    summary_data = [
        ['Total Completed', 'High Priority', 'Medium Priority', 'Low Priority'],
        [str(total_tasks), str(high_priority), str(medium_priority), str(low_priority)]
    ]
    
    summary_table = Table(summary_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fed7aa')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#9a3412')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fffbeb')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#fdba74')),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.4*inch))
    
    # Add tasks table
    if tasks:
        # Table header
        table_data = [['Task Name', 'Completed', 'Criticality', 'Assigned By']]
        
        # Add task rows
        for task in tasks:
            completion_date = task.get('completed_at', '')
            if completion_date:
                try:
                    completion_date = datetime.fromisoformat(completion_date.replace('Z', '+00:00')).strftime('%m/%d/%Y')
                except:
                    completion_date = 'N/A'
            
            title = task.get('title', '')
            if len(title) > 40:
                title = title[:37] + '...'
            
            table_data.append([
                title,
                completion_date,
                task.get('criticality', '').upper(),
                task.get('assigner', {}).get('username', 'N/A')
            ])
        
        # Create table
        task_table = Table(table_data, colWidths=[3*inch, 1.3*inch, 1.2*inch, 1.3*inch])
        task_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f97316')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ]))
        elements.append(task_table)
    else:
        no_tasks = Paragraph("No completed tasks found for this period.", styles['Normal'])
        elements.append(no_tasks)
    
    # Build PDF
    doc.build(elements)
    
    # Get the value of the BytesIO buffer and return it
    pdf_content = buffer.getvalue()
    buffer.close()
    return pdf_content
