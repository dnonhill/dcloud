import itertools

from rest_framework import serializers

from .models import FormConfig


class FormConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormConfig
        fields = ("value", "display", "extra_fields")


class FormConfigSetSerializer(serializers.Serializer):
    def to_representation(self, configs):
        grouped_data = self._group_data(configs)
        results = {}
        for page, field_group in grouped_data.items():
            if page not in results:
                results[page] = {}
            for field, configs in field_group.items():
                configs.sort(key=lambda conf: conf.sequence)
                results[page][field] = [
                    FormConfigSerializer(conf).data for conf in configs
                ]

        return results

    def _group_data(self, configs):
        results = {}
        for conf in configs:
            if conf.page not in results:
                results[conf.page] = {}
            page = results[conf.page]

            if conf.field not in page:
                page[conf.field] = []
            page[conf.field].append(conf)

        return results

class FormFieldOSSerializer(serializers.Serializer):
    distro = serializers.CharField(required=False)
    os_disk = serializers.IntegerField(required=False, source='osDisk')
    os_type = serializers.CharField(required=False, source='osType')
