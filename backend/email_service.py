import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SMTP Configuration from environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER)
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "SyncDeck")

def send_task_assignment_email(
    recipient_email: str,
    recipient_name: str,
    task_title: str,
    task_description: str,
    assigner_name: str,
    deadline: Optional[str] = None,
    criticality: str = "medium"
) -> bool:
    """
    Send an email notification when a task is assigned to a user.
    
    Args:
        recipient_email: Email address of the task assignee
        recipient_name: Name of the task assignee
        task_title: Title of the assigned task
        task_description: Description of the task
        assigner_name: Name of the person who assigned the task
        deadline: Optional deadline for the task
        criticality: Task criticality level (low, medium, high)
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    # Skip if SMTP is not configured
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP not configured. Skipping email notification.")
        return False
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = f"New Task Assigned: {task_title}"
        message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message["To"] = recipient_email
        
        # Create HTML email body
        criticality_colors = {
            "high": "#dc2626",
            "medium": "#f59e0b",
            "low": "#10b981"
        }
        criticality_color = criticality_colors.get(criticality.lower(), "#6b7280")
        
        deadline_html = f"""
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Deadline:</td>
                <td style="padding: 8px 0; color: #111827;">{deadline}</td>
            </tr>
        """ if deadline else ""
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">New Task Assigned</h1>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 30px;">
                        <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                            Hi <strong>{recipient_name}</strong>,
                        </p>
                        
                        <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                            You have been assigned a new task by <strong>{assigner_name}</strong>.
                        </p>
                        
                        <!-- Task Details Card -->
                        <div style="background-color: #f9fafb; border-left: 4px solid {criticality_color}; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h2 style="margin: 0 0 15px; color: #111827; font-size: 20px; font-weight: 600;">{task_title}</h2>
                            
                            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 120px;">Criticality:</td>
                                    <td style="padding: 8px 0;">
                                        <span style="display: inline-block; padding: 4px 12px; background-color: {criticality_color}; color: #ffffff; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                                            {criticality}
                                        </span>
                                    </td>
                                </tr>
                                {deadline_html}
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Assigned by:</td>
                                    <td style="padding: 8px 0; color: #111827;">{assigner_name}</td>
                                </tr>
                            </table>
                            
                            <div style="margin-top: 15px;">
                                <p style="margin: 0 0 8px; color: #6b7280; font-weight: 500; font-size: 14px;">Description:</p>
                                <p style="margin: 0; color: #374151; line-height: 1.6;">{task_description}</p>
                            </div>
                        </div>
                        
                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:5173/dashboard" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
                                View Task in Dashboard
                            </a>
                        </div>
                        
                        <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Please log in to your SyncDeck dashboard to view full task details and start working on it.
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                            This is an automated message from SyncDeck. Please do not reply to this email.
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        text_content = f"""
        New Task Assigned
        
        Hi {recipient_name},
        
        You have been assigned a new task by {assigner_name}.
        
        Task: {task_title}
        Criticality: {criticality.upper()}
        {f'Deadline: {deadline}' if deadline else ''}
        
        Description:
        {task_description}
        
        Please log in to your SyncDeck dashboard to view full task details.
        
        ---
        This is an automated message from SyncDeck.
        """
        
        # Attach both versions
        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        message.attach(part1)
        message.attach(part2)
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)
        
        logger.info(f"Task assignment email sent successfully to {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send task assignment email: {str(e)}")
        return False
