import calendar
import os

from datetime import datetime
from decimal import Decimal, ROUND_UP

from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from weasyprint import HTML

from django.core.mail import EmailMessage
from django.db import connection
from django.template import loader

from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from cloudform.organizes.models import Organize


def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


def get_first_last_day_of_month(year, month):
    return calendar.monthrange(int(year), int(month))[1]


def get_description(inventory):
    name = inventory.get("name")
    if "Disk" in name:
        return "{} {}".format(inventory.get("unit"), "GB")
    elif "vCPU" in name:
        return "{} {}".format(inventory.get("unit"), "Core")
    elif "Memory" in name:
        return "{} {}".format(inventory.get("unit"), "GB")
    else:
        return "{} {}".format(inventory.get("unit"), "Unit")


class InvoiceViewSet(APIView):
    permission_classes = ()

    def post(self, request, *args, **kwargs):

        condition = ""
        operator = ""
        criteria_val = ""
        criteria_val_display = ""
        period = request.data["period"]
        last_day = get_first_last_day_of_month(period["year"], period["month"])
        period_from = "{}-{}-{} 00:00:00".format(period["year"], period["month"], "01")
        period_to = "{}-{}-{} 23:59:59".format(period["year"], period["month"], last_day)
        criteria_type = ""
        organize = get_object_or_404(Organize, id=request.data["organization_id"])
        if request.data["project"] is not None:
            condition = "ii.project_name"
            criteria_val = request.data["project"]
            criteria_type = "Project Name"
            operator = "="
        elif request.data["application"] is not None:
            condition = "ii.application_name"
            criteria_type = "Application Name"
            criteria_val = request.data["application"]
            operator = "="
        elif request.data["job_code"] is not None:
            condition = "ii.job_code"
            criteria_val = request.data["job_code"]
            criteria_type = "Job Code"
            operator = "="
        elif request.data["tags"] is not None:
            condition = "ii.tags::text[]"
            criteria_val = list(request.data["tags"])
            criteria_type = "Tags Name"
            operator = "&&"

        if isinstance(criteria_val, list):
            criteria_val_display = " or ".join(criteria_val)
        else:
            criteria_val_display = criteria_val

        report_content = {
            'bill_from_address': 'Energy Complex Building A 555/1, Vibhavadi Rangsit Rd.,Chatuchak, Bangkok, 10900, '
                                 'Thailand',
            'bill_to_address': organize.address,
            'tenant_code': organize.tenant_name,
            'project_name': criteria_val_display,
            "criteria_type": criteria_type,
            'period_from': datetime.strptime(period_from, "%Y-%m-%d %H:%M:%S").strftime("%d-%b-%Y"),
            'period_to': datetime.strptime(period_to, "%Y-%m-%d %H:%M:%S").strftime("%d-%b-%Y"),
            'summary': 0,
            'servers': []
        }

        with connection.cursor() as c:
            sql = """
            select  vm_name,name,unit,price,hrs from (
                select ii.name vm_name, dt.name, dt.unit unit,dt.category, sum(dt.price) price, count(dt.name) hrs
                from inventories_pricedetail dt
                inner join inventories_inventory ii on ii.id = dt.inventory_id
                where {0} {1} %s and ii.create_date between %s and %s
            group by ii.name, dt.name,dt.unit,dt.category  ) as vm order by vm.category asc
             """.format(condition, operator)
            c.execute(sql, (criteria_val, period_from, period_to))
            inventories = dictfetchall(c)
            server_map = {}
            summary = 0
            for inventory in inventories:
                summary += Decimal(inventory["price"]).quantize(Decimal('1.00'), rounding=ROUND_UP)
                if inventory.get("vm_name") in server_map:
                    temp = server_map[inventory["vm_name"]]
                    price = Decimal(inventory["price"]).quantize(Decimal('1.00'), rounding=ROUND_UP)
                    temp["price"] = Decimal(temp.get("price")) + price
                    temp["details"].append({
                        "name": inventory.get("name"),
                        "price": price,
                        "hrs": inventory.get("hrs"),
                        "description": get_description(inventory)
                    })
                    server_map[inventory["vm_name"]] = temp

                else:
                    price = Decimal(inventory["price"]).quantize(Decimal('1.00'), rounding=ROUND_UP)
                    server_map[inventory.get("vm_name")] = {
                        "name": inventory.get("vm_name"),
                        "price": price,
                        "details": [
                            {
                                "name": inventory.get("name"),
                                "price": price,
                                "hrs": inventory.get("hrs"),
                                "description": get_description(inventory)
                            }
                        ]
                    }
            servers = []
            for s_name in server_map.keys():
                server = server_map[s_name]
                servers.append({
                    'name': server["name"],
                    'price': server["price"],
                    "details": server["details"],
                })

            report_content["summary"] = summary
            report_content["servers"] = servers
            html_string = loader.render_to_string(
                "invoice.html", report_content
            )

            html = HTML(string=html_string)
            buffer = html.write_pdf()
            email = EmailMessage(
                'DCloud: Billing of {}/{} {}'.format(period["month"], period["year"], organize.tenant_name),
                """
                Dear Sir,
                This have attachment pdf for {} for {}/{}
                """.format(organize.tenant_name, period["month"], period["year"]),
                os.environ.get("SENDMAIL_SENDER", "no-reply@saksiam.odds.team"),
                [request.data["email"]],
            )

            email.attach('invoice.pdf', buffer, 'application/pdf')
            email.send()
            return Response({}, status=status.HTTP_200_OK)

        return Response({}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
