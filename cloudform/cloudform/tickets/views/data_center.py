from rest_framework import generics, permissions
from rest_framework import status
from rest_framework import serializers
from rest_framework.decorators import permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from cloudform.tickets.models import Approver, NonPTTApprove
from cloudform.projects.models import DataCenter, DataCenterLevel
from cloudform.projects.serializers import DataCenterSerializer
from cloudform.users.serializers import UserSerializer
from cloudform.tickets.serializers.approver import ApproverSerializer
from itertools import chain


class DataCenterListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    queryset = DataCenter.objects.all()
    serializer_class = DataCenterSerializer

    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        response.data = {"results": response.data}
        return response


@permission_classes([permissions.IsAuthenticated])
class ApproversByDataCenter(APIView):
    def get(self, request, *args, **kwargs):
        data_center_id = self.kwargs.get('data_center', None)

        if data_center_id:
            data = []
            data_center = DataCenter.objects.get(id=data_center_id)
            data_center_levels = DataCenterLevel.objects.filter(data_center=data_center)

            for data_center_level in data_center_levels:
                approvers_data = []
                approvers = Approver.objects.filter(data_center_levels=data_center_level).order_by('user__first_name')
                approvers = chain(approvers)

                for approver in approvers:
                    approvers_data.append(ApproverSerializer(approver, read_only=True).data)

                data.append({
                    'level': data_center_level.level,
                    'approvers': approvers_data,
                })
            return Response(data, status=status.HTTP_200_OK)

        return Response({}, status=status.HTTP_400_BAD_REQUEST)
