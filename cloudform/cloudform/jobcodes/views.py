import datetime
from rest_framework.views import APIView, Response
from rest_framework import status, permissions
from .models import JobCode, FeatureToggle
from .serializers import JobCodeSerializer
from cloudform.users.permissions import IsRequestor, IsCloudAdmin, IsOperator


class IsSafeMethods(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        super().has_permission(request, view)
        if request.method in permissions.SAFE_METHODS:
            return True
        return False


# Create your views here.
class JobCodeView(APIView):
    permission_classes = (IsRequestor | IsCloudAdmin | IsOperator | IsSafeMethods,)

    def get(self, request, *args, **kwargs):
        if self.is_feature_toggle() and self.kwargs['job_code'] != '000000000000' and self.kwargs['job_code'] != '999999999999':
            result = JobCode.objects.using('ptt-db')\
                .filter(ORDER_NUMBER=self.kwargs['job_code']).first()
            if not result:
                return Response(
                    {
                        'code': 'J404',
                        'details': f'Job code no {self.kwargs["job_code"]} not found',
                        'message': f'Job code no {self.kwargs["job_code"]} not found',
                        'statusCode': 404,
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            serializer = JobCodeSerializer(result, many=False)
            return Response(serializer.data)
        return Response(self.mock_job_code(self.kwargs['job_code']))

    def is_feature_toggle(self):
        featureToggle = FeatureToggle.objects.get(code='PTT_JOB_CODE')
        return featureToggle and featureToggle.enable

    def mock_job_code(self, job_code):
        return {
            "ORDER_NUMBER": f'Test Job Code No {self.kwargs["job_code"]}',
            "REQUESTCCTR": f'REQUESTCCTR {self.kwargs["job_code"]}',
            "RESP_COST_CENTER": 'Test CENTER',
            "AUART": 'Test AUART',
            "DESCRIPTION": f'PTT Resource',
            "START_DATE": datetime.datetime.now(),
            "END_DATE": datetime.datetime.now(),
            "DESC_ZCO_ORCUS": 'Test Customer',
            "DESC_ZCO_ORPRT": 'Test Techno/Product',
        }
