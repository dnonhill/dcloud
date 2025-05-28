from django.db.models import BooleanField, DateTimeField, Model, QuerySet
from django.db.models import ForeignKey, DO_NOTHING
from django.contrib.auth import get_user_model

AUDIT_FIELDS = ["active_flag", "created_at", "created_by", "updated_at", "updated_by"]


class AuditQuerySet(QuerySet):
    def all_active(self, created_by=None):
        kwargs = {"active_flag": True}
        if created_by is not None:
            kwargs["created_by"] = created_by

        return self.filter(**kwargs)

    def all_inactive(self):
        return self.filter(active_flag=False)


class AuditModel(Model):
    class Meta:
        abstract = True

    created_by = ForeignKey(
        get_user_model(), related_name="+", on_delete=DO_NOTHING, null=True
    )
    updated_by = ForeignKey(
        get_user_model(), related_name="+", on_delete=DO_NOTHING, null=True
    )
    created_at = DateTimeField(auto_now_add=True, editable=False)
    updated_at = DateTimeField(auto_now=True, editable=False)
    active_flag = BooleanField(default=True)

    objects = AuditQuerySet.as_manager()

    def delete(self, using=None, keep_parents=False):
        self.active_flag = False
        self.save()

    def undelete(self):
        self.active_flag = True
        self.save()
