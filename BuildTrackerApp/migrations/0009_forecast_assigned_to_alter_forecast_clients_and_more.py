# Generated by Django 5.1.1 on 2024-12-23 09:50

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('BuildTrackerApp', '0008_alter_forecast_cw_request_plo'),
    ]

    operations = [
        migrations.AddField(
            model_name='forecast',
            name='assigned_to',
            field=models.CharField(choices=[('ODC', 'ODC'), ('COE', 'COE'), ('TBD', 'TBD')], default='TBD', max_length=3),
        ),
        migrations.AlterField(
            model_name='forecast',
            name='clients',
            field=models.IntegerField(blank=True, null=True),
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
            name='requester',
            field=models.CharField(blank=True, max_length=1000, null=True),
        ),
        migrations.AlterField(
            model_name='forecast',
            name='time_weeks',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
