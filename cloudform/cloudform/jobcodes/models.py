from django.db import models


class FeatureToggle(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255)
    enable = models.BooleanField(default=False)


class JobCode(models.Model):
    ORDER_NUMBER = models.CharField(max_length=255, primary_key=True)
    REQUESTCCTR = models.CharField(max_length=255)
    RESP_COST_CENTER = models.CharField(max_length=255)
    AUART = models.CharField(max_length=255)
    DESCRIPTION = models.CharField(max_length=255)
    START_DATE = models.DateField()
    END_DATE = models.DateField()
    DESC_ZCO_ORCUS = models.CharField(max_length=255)
    DESC_ZCO_ORPRT = models.CharField(max_length=255)
    REASON_ENV_INVEST_DESC = models.CharField(max_length=255)
    REASON_ENV_INVEST_CODE = models.CharField(max_length=255)
    SHAREIO = models.CharField(max_length=255)
    USER_STATUS = models.CharField(max_length=255)
    ACTUAL_POSTED_COSTCENTER = models.CharField(max_length=255)
    CLIENT = models.CharField(max_length=255)
    PROFIT_CENTER = models.CharField(max_length=255)
    STARTING_DATE = models.DateField()
    COST_CENTER = models.CharField(max_length=255)
    DELETE_FLAG = models.CharField(max_length=255)
    CLOSE_DATE = models.DateField()
    COMPLETION_DATE = models.DateField()
    RELEASE_DATE = models.DateField()
    ORDER_CLOSED = models.CharField(max_length=255)
    ORDER_COMPLETED = models.CharField(max_length=255)
    ORDER_RELEASED = models.CharField(max_length=255)
    ORDER_CREATED = models.CharField(max_length=255)
    CONTROLLING_AREA = models.CharField(max_length=255)
    BUSINESS_AREA = models.CharField(max_length=255)
    PLANT = models.CharField(max_length=255)
    CHANGE_DATE = models.DateField()
    ZCO_ORCUS = models.CharField(max_length=255)
    COMPANY_CODE = models.CharField(max_length=255)
    DESC_ZCO_ORESS = models.CharField(max_length=255)
    ZCO_ORESS = models.CharField(max_length=255)
    DESC_ZCO_ORPLN = models.CharField(max_length=255)
    ZCO_ORPLN = models.CharField(max_length=255)
    ZCO_ORPRT = models.CharField(max_length=255)
    DESC_ZCO_ORSVL = models.CharField(max_length=255)
    ZCO_ORSVL = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = u'"SAPIEP300"."V_0014_IO"'
