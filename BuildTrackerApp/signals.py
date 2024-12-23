from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Item

@receiver(post_save, sender=Item)
def send_email_on_status_change(sender, instance, **kwargs):
    if instance.status == 'Handedover to PLO':
        subject = 'Item Status Updated'
        message = (
            f'The item with SID "{instance.sid}" has been handed over to PLO.\n'
            f'Flavour: {instance.flavour}\n'
            f'Estimated Clients: {instance.estimated_clients}\n'
            f'Delivered Clients: {instance.delivered_clients}\n'
            f'BFS: {instance.bfs}\n'
            f'T-Shirt Size: {instance.t_shirt_size}\n'
            f'System Type: {instance.system_type}\n'
            f'Hardware: {instance.hardware}\n'
            f'Setup: {instance.setup}\n'
            f'PLO: {instance.plo.name}\n'
            f'Processor1: {instance.processor1.name}\n'
            f'Processor2: {instance.processor2.name if instance.processor2 else "None"}\n'
            f'Landscape: {instance.landscape}\n'
            f'Description: {instance.description}\n'
            f'Expected Delivery: {instance.expected_delivery}\n'
            f'Revised Delivery Date: {instance.revised_delivery_date}\n'
            f'Delivery Date: {instance.delivery_date}\n'
            f'Delivery Delay Reason: {instance.delivery_delay_reason}\n'
            f'Servicenow: {instance.servicenow}\n'
            f'Comments: {instance.comments}\n'
        )
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = ['pooja.gajghate@sap.com']  # Replace with actual recipient list

        send_mail(subject, message, from_email, recipient_list)

# Register the signal
from django.apps import AppConfig

class YourAppConfig(AppConfig):
    name = 'BuildTrackerApp'

    def ready(self):
        import BuildTrackerApp.signals
