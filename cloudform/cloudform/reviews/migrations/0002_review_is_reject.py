# Generated by Django 2.2.3 on 2020-08-21 03:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reviews', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='review',
            name='is_reject',
            field=models.BooleanField(blank=True, null=True),
        ),
    ]
