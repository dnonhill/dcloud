from rest_framework import serializers

from cloudform.user_domain.models import UserDomain


class UserDomainSearchRequestSerializer(serializers.Serializer):
    user = serializers.CharField(required=True)


class UserDomainSearchSerializer(serializers.Serializer):
    user_dn = serializers.CharField()
    attributes = serializers.DictField()

    def __init__(self, *args, **kwargs):
        data = kwargs.get("data", None)
        if data:
            kwargs["data"] = {"user_dn": data[0], "attributes": data[1]}
        super().__init__(*args, **kwargs)


class UserDomainSearchResponseSerializer(serializers.Serializer):
    users = UserDomainSearchSerializer(many=True)

    def __init__(self, *args, **kwargs):
        data = kwargs.get("data", None)

        if data is not None and isinstance(data, list):
            kwargs["data"] = {"users": kwargs["data"]}

        super().__init__(*args, **kwargs)


class UserDomainSelectSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDomain
        fields = ("name", "display_name")
