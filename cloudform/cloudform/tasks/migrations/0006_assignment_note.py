# Generated by Django 2.2.3 on 2020-08-17 09:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0005_assignment_overdue_alerted_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='assignment',
            name='note',
            field=models.CharField(max_length=255, blank=True, null=True),
        ),
    ]
