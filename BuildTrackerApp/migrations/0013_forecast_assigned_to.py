# Generated by Django 5.1.1 on 2024-12-24 09:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('BuildTrackerApp', '0012_alter_item_sid'),
    ]

    operations = [
        migrations.AddField(
            model_name='forecast',
            name='assigned_to',
            field=models.CharField(choices=[('COE', 'COE'), ('ODC', 'ODC'), ('TBD', 'TBD')], default='TBD', max_length=3),
        ),
    ]
