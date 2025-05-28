from django.contrib.auth.models import Group as DjangoGroup
from django.core.exceptions import ObjectDoesNotExist
from django.utils.translation import ugettext_lazy as _
from rest_framework.exceptions import ValidationError
from rest_framework.serializers import CharField, ModelSerializer, Serializer

from cloudform.users.models import User


class UserSerializer(ModelSerializer):
    fullname = CharField(source="get_full_name")

    class Meta:
        model = User
        fields = ("id", "username", "email", "fullname", "department", "organization", "mobile")
        read_only_fields = ("id", "username", "email", "fullname", "department", "organization", "mobile")



class GroupSerializer(ModelSerializer):
    class Meta:
        model = DjangoGroup
        fields = ("id", "name")


class UserListSerializer(ModelSerializer):
    queryset = User.objects.select_related("groups").all()
    groups = GroupSerializer(many=True)

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "groups")


class UserDetailSerializer(ModelSerializer):
    fullname = CharField(source="get_full_name")
    groups = GroupSerializer(many=True)

    APPROVER_GROUP = DjangoGroup(id=0, name="approver")
    REVIEWER_GROUP = DjangoGroup(id=1, name="reviewer")

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Add "approver" group if there is a relation
        # TODO Remove add more information about data centers
        self.add_approver_group(data, instance)
        self.add_reviewer_group(data, instance)

        return data

    def add_approver_group(self, data, instance):
        try:
            instance.approver
        except ObjectDoesNotExist:
            return

        serializer = GroupSerializer(self.APPROVER_GROUP)

        groups = data.get("groups", [])
        groups.append(serializer.data)

        data["groups"] = groups
        
    def add_reviewer_group(self, data, instance):
        try:
            instance.reviewer
        except ObjectDoesNotExist:
            return

        serializer = GroupSerializer(self.REVIEWER_GROUP)

        groups = data.get("groups", [])
        groups.append(serializer.data)

        data["groups"] = groups

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "fullname",
            "first_name",
            "last_name",
            "email",
            "telephone",
            "mobile",
            "department",
            "company",
            "organization",
            "is_local",
            "groups",
        )


class PasswordResetSerializer(Serializer):
    token = CharField()
    password = CharField(
        min_length=9, max_length=35, allow_blank=False, allow_null=False
    )

    INVALID_TOKEN_ERROR = ValidationError(
        _("Invalid email account or token"), code="invalid"
    )

    def update(self, instance, validated_data):
        if not instance.check_password_token(validated_data["token"]):
            raise self.INVALID_TOKEN_ERROR
        instance.set_password(validated_data["password"])
        instance.save()


class ChangePasswordSerializer(Serializer):
    old_password = CharField(required=True)
    new_password = CharField(required=True)

    def update(self, user, validated_data):
        if not user.check_password(validated_data.get("old_password")):
            raise ValidationError(detail={"old_password": ["Password is mismatch"]})

        user.set_password(validated_data.get("new_password"))
        user.save()


class EditProfileSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "telephone",
            "mobile",
            "department",
            "company",
            "organization",
        )

