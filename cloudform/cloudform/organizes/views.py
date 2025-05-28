from django.shortcuts import render

from rest_framework.response import Response
from rest_framework.views import APIView

from cloudform.organizes.models import Organize
from cloudform.organizes.serializers import OrganizeSerializer


class OrganizeView(APIView):
    permission_classes = ()

    def get(self, request, *args, **kwargs):
        organizes = Organize.objects.all()
        serializer = OrganizeSerializer(organizes, many=True)
        
        return Response(serializer.data)
