from rest_framework import serializers
from cloudform.tickets.models import Approver
from cloudform.users.serializers import UserSerializer


class ApproverSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Approver
        exclude = ("data_center_levels",)
