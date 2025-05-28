from rest_framework import mixins, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from cloudform.user_domain import ldap, serializers
from cloudform.user_domain.models import UserDomain
from cloudform.user_domain.serializers import UserDomainSelectSerializer


class UserDomainSearchView(APIView):
    serializer_class = serializers.UserDomainSearchRequestSerializer
    permission_classes = ()

    def post(self, request):
        req_ser = serializers.UserDomainSearchRequestSerializer(data=request.data)
        req_ser.is_valid(raise_exception=True)

        search_result = ldap.search(req_ser.data["user"])

        res_ser = serializers.UserDomainSearchResponseSerializer(
            data=self._serialize_data(search_result)
        )
        res_ser.is_valid()
        return Response(res_ser.data)

    def _serialize_data(self, result):
        return [dict(zip(("user_dn", "attributes"), rec)) for rec in result]


class UserDomainViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = UserDomain.objects.exclude(display_name="")
    serializer_class = UserDomainSelectSerializer
    permission_classes = ()
