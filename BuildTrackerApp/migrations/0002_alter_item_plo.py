# Generated by Django 5.1.1 on 2024-09-12 03:47

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('BuildTrackerApp', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='item',
            name='plo',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='plo_items', to='BuildTrackerApp.plo'),
        ),
    ]
