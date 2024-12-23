import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

def send_status_update_email(sid, status, item_details):
    sender = 'noreply+dlmsystembuild@sap.corp'
    recipient = ['pooja.gajghate@sap.com'] 
    subject = f'Status Update for System <strong>{sid}</strong>'

    # Prepare the email body
    body = ''
    if status == "Handedover to PLO":
        body += f'<p>The status for system <strong>{sid}</strong> has been updated to "<strong>{status}</strong>".</p>'
        body += '<div style="max-height: 400px; overflow-y: auto; border: 1px solid #ccc; border-radius: 5px;">'
        body += format_item_details_as_html(item_details)
        body += '</div>'
    else:
        body = f'<p>The status for system <strong>{sid}</strong> has been updated to "<strong>{status}</strong>".</p>'

    # Create a multipart email message
    msg = MIMEMultipart("alternative")
    msg['From'] = formataddr(('DLM System Build', sender))
    msg['To'] = ', '.join(recipient)
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    try:
        with smtplib.SMTP('mail.sap.corp', 587) as server:
            server.starttls()  # Secure the connection
            server.login('dlmsystembuild-mails', 'DLMops@4')  # Authenticate
            server.sendmail(sender, recipient, msg.as_string())
            print("Email sent successfully!")

    except Exception as e:
        print(f"Failed to send email: {e}")

def format_item_details_as_html(original_item):
    # Ensure that original_item is a dictionary
    if not isinstance(original_item, dict):
        raise ValueError("original_item must be a dictionary.")

    # Define the table headers and row
    headers = [
        "Requested Date", "Flavour", "SID", "Estimated Clients", "Delivered Clients",
        "BFS", "T-Shirt Size", "System Type", "Hardware", "Setup", "PLO",
        "Processor1", "Processor2", "Status", "Landscape", "Description",
        "Expected Delivery", "Revised Delivery Date", "Delivery Date",
        "Delivery Delay Reason", "ServiceNow", "Comments"
    ]

    # Create a row from the dictionary values
    row = [
        original_item.get('requested_date', ''),
        original_item.get('flavour', ''),
        original_item.get('sid', ''),
        original_item.get('estimated_clients', ''),
        original_item.get('delivered_clients', ''),
        original_item.get('bfs', ''),
        original_item.get('t_shirt_size', ''),
        original_item.get('system_type', ''),
        original_item.get('hardware', ''),
        original_item.get('setup', ''),
        original_item.get('plo', ''),
        original_item.get('processor1', ''),
        original_item.get('processor2', ''),
        original_item.get('status', ''),
        original_item.get('landscape', ''),
        original_item.get('description', ''),
        original_item.get('expected_delivery', ''),
        original_item.get('revised_delivery_date', ''),
        original_item.get('delivery_date', ''),
        original_item.get('delivery_delay_reason', ''),
        original_item.get('servicenow', ''),
        original_item.get('comments', '')
    ]

    # Create the HTML table
    html_table = '<table style="width: 100%; border-collapse: collapse;">'
    html_table += '<thead><tr>' + ''.join(f'<th style="border: 1px solid #ddd; padding: 10px; background-color: #f2f2f2; text-align: center;">{header}</th>' for header in headers) + '</tr></thead>'
    html_table += '<tbody><tr>' + ''.join(f'<td style="border: 1px solid #ddd; padding: 10px; text-align: center;">{item}</td>' for item in row) + '</tr></tbody>'
    html_table += '</table>'

    return html_table
