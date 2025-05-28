from django.db import models, transaction
from django.conf import settings


class Sequence(models.Model):
    INITIAL = settings.ZOUTH_SEQUENCE_INITIAL
    name = models.CharField(max_length=255)
    prefix = models.CharField(max_length=255)
    running = models.IntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["name", "prefix"], name="unique_sequence")
        ]

    def __str__(self):
        return f"{self.name}: {self.prefix} {self.running}"

    @classmethod
    def next(cls, name: str, prefix: str) -> int:
        result = cls.objects.filter(name=name, prefix=prefix).aggregate(
            models.Max("running")
        )
        latest_running = result.get("running__max")
        if latest_running is None:
            obj = cls.objects.create(name=name, prefix=prefix, running=cls.INITIAL)
            obj.save()

            return cls.INITIAL
        else:
            with transaction.atomic():
                obj = cls.objects.select_for_update().get(name=name, prefix=prefix)
                obj.running = models.F("running") + 1
                obj.save()
                obj.refresh_from_db()

            return obj.running
