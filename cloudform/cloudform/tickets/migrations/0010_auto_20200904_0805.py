# Generated by Django 2.2.3 on 2020-09-04 08:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0008_datacenterlevel'),
        ('tickets', '0009_auto_20200903_0753'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='approver',
            name='data_centers',
        ),
        migrations.AddField(
            model_name='approver',
            name='data_center_levels',
            field=models.ManyToManyField(blank=True, related_name='approver_set', related_query_name='approver', to='projects.DataCenterLevel', verbose_name='data_center_levels'),
        ),
    ]
