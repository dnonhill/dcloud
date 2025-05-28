from rest_framework.serializers import ModelSerializer

from cloudform.users.serializers import UserSerializer
from cloudform.tasks.models import Assignment

class AssignmentSerializer(ModelSerializer):
    assignee = UserSerializer(read_only=True)

    class Meta:
        model = Assignment
        fields = ["assignee"]