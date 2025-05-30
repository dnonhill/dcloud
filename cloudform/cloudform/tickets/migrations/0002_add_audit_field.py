# Generated by Django 2.2.3 on 2019-12-10 09:14

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("projects", "0002_add_audit_field"),
        ("tickets", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="created_by",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="ticket",
            name="data_center",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="tickets",
                to="projects.DataCenter",
            ),
        ),
        migrations.AddField(
            model_name="ticket",
            name="updated_by",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="approver",
            name="data_centers",
            field=models.ManyToManyField(
                blank=True,
                related_name="approver_set",
                related_query_name="approver",
                to="projects.DataCenter",
                verbose_name="data_centers",
            ),
        ),
        migrations.AddField(
            model_name="approver",
            name="user",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="approver",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="approvement",
            name="approver",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="approvements",
                to="tickets.Approver",
            ),
        ),
        migrations.AddField(
            model_name="approvement",
            name="ticket",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="approvements",
                to="tickets.Ticket",
            ),
        ),
    ]
