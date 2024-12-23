import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

def send_status_update_email(sid, status, item_details):
    sender = 'noreply+dlmsystembuild@sap.corp'
    recipient = ['pooja.gajghate@sap.com' , 'adil.basha.bommagatti@sap.com' ]
    subject = f'Status Update for Item {sid}'
    
    # Prepare the email body
    body = f'The status for item {sid} has been updated to "{status}".\n\nDetails:\n{item_details}'

    # Create a multipart email message
    msg = MIMEMultipart()
    msg['From'] = formataddr(('DLM System Build', sender))
    msg['To'] = ', '.join(recipient)
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP('mail.sap.corp', 587) as server:
            server.starttls()  # Secure the connection
            server.login('dlmsystembuild-mails', 'DLMops@4')  # Authenticate
            server.sendmail(sender, recipient, msg.as_string())
            print("Email sent successfully!")

    except Exception as e:
        print(f"Failed to send email: {e}")
