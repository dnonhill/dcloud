# Generated by Django 2.2.3 on 2020-02-12 09:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("user_domain", "0002_auto_20200212_0817"),
    ]

    operations = [
        migrations.AlterField(
            model_name="userdomain",
            name="display_name",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
