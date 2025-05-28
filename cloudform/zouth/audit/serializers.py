from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    fullname = serializers.CharField(source="get_full_name")

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "fullname",
            "mobile",
            "department",
            "organization",
        )
        read_only_fields = ("id", "username", "email", "first_name", "last_name", "fullname")


class AuditModelSerializer(serializers.ModelSerializer):
    active_flag = serializers.BooleanField(read_only=True, default=True, initial=True)
    created_by = UserSerializer(read_only=True, allow_null=True)
    updated_by = UserSerializer(read_only=True, allow_null=True)

    def create(self, validated_data):
        validated_data["created_by"] = self.current_user
        validated_data["updated_by"] = self.current_user

        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data["updated_by"] = self.current_user
        return super().update(instance, validated_data)

    @property
    def current_user(self):
        return self.context["request"].user
