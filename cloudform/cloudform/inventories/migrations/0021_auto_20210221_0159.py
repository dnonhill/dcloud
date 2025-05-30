# Generated by Django 2.2.3 on 2021-02-21 01:59

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('inventories', '0020_remove_inventorylist_data_center'),
    ]

    operations = [
        migrations.AlterField(
            model_name='inventorylist',
            name='data_center_ref',
            field=models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, related_name='inventory_list', to='projects.DataCenter'),
        ),
    ]
