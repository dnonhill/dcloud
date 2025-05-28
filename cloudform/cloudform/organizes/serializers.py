from rest_framework import serializers

from cloudform.organizes.models import Organize


class OrganizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organize
        fields = '__all__'
