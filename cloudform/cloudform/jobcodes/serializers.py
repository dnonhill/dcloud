from rest_framework import serializers
from .models import JobCode


class JobCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCode
        fields = '__all__'
