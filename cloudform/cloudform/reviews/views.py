from datetime import datetime
from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.decorators import action
from rest_framework import permissions, exceptions
from rest_framework.response import Response
from .serializers import (
    ReviewDetailSerializer, 
    ReviewBriefSerializer,
    ReviewRejectSerializer,
    ReviewCommentSerializer,
)
from .models import Review, Reviewer
from zouth.exceptions import Conflict
from django.db.models import Q
from rest_framework import status


class IsReviwer(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        is_authenticated = super().has_permission(request, view)
        if not is_authenticated:
            return False

        current_user = request.user
        return Reviewer.objects.filter(user=current_user).exists()
    
class ReviweViewSet(ModelViewSet):
    permission_classes = (IsReviwer,)
    serializer_class = ReviewDetailSerializer
    
    filterset_fields = {"ticket__ticket_no": ["exact", "contains", "startswith"]}
    ordering_fields = ["requested_at", "reviewed_at"]
    ordering = ["requested_at"]
    pagination_class = LimitOffsetPagination
    
    def get_queryset(self):
        queryset = Review.objects.all()
        if "pending" in self.request.query_params:
            queryset = queryset.filter(reviewer_id=None)
        elif "commented" in self.request.query_params:
            queryset = queryset.filter(Q(is_reviewed=False) & Q(is_reject=None) & Q(ticket__status='commented'))
        elif "approved" in self.request.query_params:
            queryset = queryset.filter(is_reviewed=True)
        elif "rejected" in self.request.query_params:
            queryset = queryset.filter(is_reject=True)
        elif "all" in self.request.query_params:
            queryset = queryset.filter(Q(reviewer_id=None) | Q(is_reviewed=True) | Q(is_reject=True) | Q(ticket__status='commented'))

            
        
        queryset = queryset.select_related(
            "reviewer",
            "ticket",
            "ticket__created_by",
            "ticket__updated_by",
            "ticket__application",
            "ticket__application__project",
        )

        
        if self.action == "retrieve":
            queryset = queryset.prefetch_related(
                "ticket__items", "ticket__items__resource", "ticket",
            )

        return queryset
    
    def get_serializer(self, *args, **kwargs):
        if self.action == "list":
            return ReviewBriefSerializer(*args, **kwargs)
        return super().get_serializer(*args, **kwargs)
    
    @action(detail=True, methods=["PUT"])
    def approve(self, request, pk=None):
        obj = self.get_object()
        if obj.is_reviewed is not False or obj.is_reject is True:
            raise exceptions.ValidationError(
                "Cannot approve the approved request.", code="roong"
            )

        self.validate_ticket_timestamp(obj, request.data)
        
        obj.approve(self.current_reviewer)
        serializer = self.get_serializer(obj, many=False)
        return Response(serializer.data)
    
    @action(detail=True, methods=["PUT"])
    def reject(self, request, pk=None):
        obj = self.get_object()
        if obj.is_reviewed or obj.is_reject:
            raise exceptions.ValidationError("Cannot reject the approved request.")
        self.validate_ticket_timestamp(obj, request.data)
        
        request_serializer = ReviewRejectSerializer(data=request.data)
        
        if request_serializer.is_valid():
            obj.reject(self.current_reviewer, request_serializer.data["note"])
            response_serializer = self.get_serializer(obj, many=False)
            return Response(response_serializer.data)
        else:
            return Response(
                request_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )
            
    @action(detail=True, methods=["PUT"])
    def comment(self, request, pk=None):
        obj = self.get_object()
        if obj.is_reviewed or obj.is_reject:
            raise exceptions.ValidationError("Cannot comment the comment request.")
        self.validate_ticket_timestamp(obj, request.data)
        
        request_serializer = ReviewCommentSerializer(data=request.data)
        
        if request_serializer.is_valid():
            obj.commented(self.current_reviewer, request_serializer.data["note"])
            response_serializer = self.get_serializer(obj, many=False)
            return Response(response_serializer.data)
        else:
            return Response(
                request_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )
    
    @staticmethod
    def validate_ticket_timestamp(obj, data, raise_exception=True):
        if "ticket_timestamp" in data:
            iso_datetime = data["ticket_timestamp"].replace("Z", "+00:00")
            ticket_timestamp = datetime.fromisoformat(iso_datetime)
            if ticket_timestamp == obj.ticket.updated_at:
                return

        error = Conflict("Ticket was updated while you are review.")
        if raise_exception:
            raise error
        else:
            return error
    @property
    def current_reviewer(self):
        current_user = self.request.user
        return Reviewer.objects.filter(user=current_user).first()
