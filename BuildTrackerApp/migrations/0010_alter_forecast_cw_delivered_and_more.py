# Generated by Django 5.1.1 on 2024-12-23 10:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('BuildTrackerApp', '0009_forecast_assigned_to_alter_forecast_clients_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='forecast',
            name='cw_delivered',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='forecast',
            name='cw_request_plo',
            field=models.TextField(blank=True, null=True),
        ),
    ]
