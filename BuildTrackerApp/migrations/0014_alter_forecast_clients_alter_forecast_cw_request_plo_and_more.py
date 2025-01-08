# Generated by Django 5.1.1 on 2025-01-03 05:17

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('BuildTrackerApp', '0013_forecast_assigned_to'),
    ]

    operations = [
        migrations.AlterField(
            model_name='forecast',
            name='clients',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AlterField(
            model_name='forecast',
            name='cw_request_plo',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='forecast',
            name='item',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='forecasts', to='BuildTrackerApp.item'),
        ),
        migrations.AlterField(
            model_name='forecast',
            name='parallel_processing',
            field=models.BooleanField(blank=True, default=False, null=True),
        ),
        migrations.AlterField(
            model_name='forecast',
            name='time_weeks',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
