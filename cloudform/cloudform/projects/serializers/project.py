from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from cloudform.users.models import Requestor
from zouth.audit.serializers import AuditModelSerializer
from cloudform.users.serializers import UserSerializer
from cloudform.projects.models import Project


class ProjectSerializer(AuditModelSerializer):
    class Meta:
        model = Project
        exclude = ("members",)
        extra_kwargs = {
            "name": {"validators": [UniqueValidator(queryset=Project.objects.all())]}
        }

    owner = UserSerializer(default=serializers.CurrentUserDefault())
    can_delete = serializers.BooleanField(read_only=True)

    def to_representation(self, instance):
        if isinstance(self.parent, serializers.ListSerializer):
            self.fields.pop("owner", None)
            self.fields.pop("can_delete", None)
            self.fields.pop("created_at", None)
            self.fields.pop("created_by", None)
            self.fields.pop("updated_at", None)
            self.fields.pop("updated_by", None)

        return super().to_representation(instance)

    def create(self, validated_data):
        obj = super().create(validated_data)
        owner = obj.owner
        if not obj.members.all():
            obj.members.set([owner])

        return obj


class MinimalProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name")


class ProjectOwnerSerializer(serializers.Serializer):
    domain = serializers.CharField(allow_null=True)
    is_local = serializers.BooleanField(default=False)
    username = serializers.CharField()

    def validate(self, attrs):
        requestor = Requestor.objects.filter(
            domain=attrs["domain"],
            is_local=attrs["is_local"],
            username=attrs["username"],
        ).first()

        if requestor is None:
            raise serializers.ValidationError(
                "User is not exists. Make sure that the new user has logged into the system."
            )

        attrs["requestor"] = requestor
        return attrs


class TransferProjectOwnerSerializer(serializers.Serializer):
    new_owner = ProjectOwnerSerializer()

    def update(self, instance, validated_data):
        instance.transfer_owner(validated_data["new_owner"]["requestor"])
