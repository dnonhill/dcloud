# Generated by Django 2.2.3 on 2020-08-20 07:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0005_ticket_closed_by'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ticket',
            name='status',
            field=models.CharField(choices=[('created', 'Created'), ('commented', 'Commented'), ('feedback_applied', 'feedback_applied'), ('reviewed', 'Reviewed'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('assigned', 'Assigned'), ('completed', 'Completed')], default='created', max_length=255),
        ),
    ]
