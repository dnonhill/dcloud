import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from cloudform.projects.models import Project, Application

logger = logging.getLogger(__name__)


def extract_username(user):
    return user.get_full_name() if user is not None else "system"


@receiver(post_save, sender=Project)
def save_project(sender, instance: Project, created, raw, **kwargs):
    if created:
        logger.info(
            f"{sender.__name__.upper()}_CREATED by {extract_username(instance.created_by)}"
        )
    else:
        if instance.active_flag:
            logger.info(
                f"{sender.__name__.upper()}_UPDATED {extract_username(instance.updated_by)}"
            )
        else:
            logger.info(
                f"{sender.__name__.upper()}_DELETED by {extract_username(instance.updated_by)}"
            )


@receiver(post_save, sender=Application)
def save_application(sender, instance: Application, created, raw, **kwargs):
    if created:
        logger.info(
            f"{sender.__name__.upper()}_CREATED by {extract_username(instance.updated_by)}"
        )
    else:
        if instance.active_flag:
            logger.info(
                f"{sender.__name__.upper()}_UPDATED by {extract_username(instance.updated_by)}"
            )
        else:
            logger.info(
                f"{sender.__name__.upper()}_DELETED by {extract_username(instance.updated_by)}"
            )
