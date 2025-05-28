from rest_framework import serializers


class DetailSerializers(serializers.Serializer):
    name = serializers.CharField(required=False)
    price = serializers.CharField(required=False)
    description = serializers.CharField(required=False)


class ServerSerializers(serializers.Serializer):
    name = serializers.CharField(required=False)
    price = serializers.CharField(required=False)
    details = DetailSerializers()


class InvoiceSerializers(serializers.Serializer):
    project_name = serializers.CharField(required=False)
    bill_to_address = serializers.CharField(required=False)
    invoice_date = serializers.CharField(required=False)
    due_date = serializers.CharField(required=False)
    billing_period = serializers.CharField(required=False)
    summary = serializers.CharField(required=False)
    servers = ServerSerializers()
