from django.core.management import CommandError, BaseCommand
from cloudform.inventories.models import (
    Inventory,
    PriceDetail,
    InventoryList,
)
from cloudform.inventories.documents import (
    InventoryDocument,
    PriceDetailDocument,
)
from django.db import transaction
from django.db.models import Q
import datetime
import pytz
import random
import logging
import time

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Job clean data inventory every date"
    def add_arguments(self, parser):
        parser.add_argument('date-beforedelete', nargs='?', type=str, help='2022-03-15')
        
    def handle(self, *args, **options):
        logger.info('start update data')
        self.fix_els_data(options['date-beforedelete'])
        logger.info('done!!!!')
    def fix_els_data(self,date_beforedelete = None ):
        inventoryLists = InventoryList.objects.filter(Q(active_flag=True))
        today = datetime.date.today()
        if date_beforedelete != None:
            today = datetime.datetime.strptime(date_beforedelete, "%Y-%m-%d").date()
        
        yesterday = today - datetime.timedelta(days=1)
        print('today >>> ', today)
        print('yesterday >>> ', yesterday)
        for inventorylist in inventoryLists:
            try:
                self._create_inventory_by_day(
                    yesterday=yesterday,
                    inventorylist=inventorylist
                )
            except Exception as a:
                logger.error(str(a))
                logger.error(f'fix_els_data -> Inventory list id {inventorylist.id}')
                logger.error(f'fix_els_data -> Inventory name {inventorylist.name}')


    @transaction.atomic
    def _create_inventory_by_day(self, yesterday, inventorylist):
            inventoryLasted = None
            year = yesterday.year
            month = f'{yesterday.month}'.zfill(2)
            day = f'{yesterday.day}'.zfill(2)
            data_range = f'{year}-{month}-{day}'
#            sql = """SELECT * FROM inventories_inventory where inventories_inventory.name = '{0}' and inventories_inventory.create_date::TEXT LIKE '%%{1}%%' ORDER BY "id" LIMIT 300 OFFSET 0"""\
#                .format(inventorylist.name, data_range)
#            inve_list = Inventory.objects.raw(sql)
#            beforeyesterday = datetime.datetime(yesterday.year, yesterday.month, yesterday.day, 0, 0, 0, 0, pytz.timezone('Etc/GMT')) - datetime.timedelta(hours=31)
            inve_list = Inventory.objects.filter(
                    Q(name=inventorylist.name) &
                    Q(create_date__gte=yesterday-datetime.timedelta(hours=7)) &
                    Q(create_date__lt=yesterday+datetime.timedelta(hours=17))
                    )
            print (inve_list.query)
            print ('len_inve=', len(inve_list))
            if (len(inve_list) < 24 ):
                count = len(inve_list)
                    
                for hour in range(0, 24):
                    date = datetime.datetime(yesterday.year, yesterday.month, yesterday.day, hour, 0, 1, 0, pytz.timezone('Etc/GMT')) - datetime.timedelta(hours=7)
                    print (date)
                    found = None
                    print ('count=', count)
                    if count >= 24 :
                        break
                    for inve in inve_list:
                        inv = inve
                        if count >= 24 :
                            break
                        #print ('create_date.hour=',inv.create_date)
                        #print ('id', inv.id)
                        #print ('hour', hour)
                        utc_hour = inv.create_date + datetime.timedelta(hours=7)
                        #print ('utc_hour', utc_hour.hour )
                       
                        if utc_hour.hour == hour:
                            print ('create_date.hour=',inv.create_date)
                            print ('id', inv.id)
                            print ('hour', hour)
                            print ('utc_hour', utc_hour.hour )
                            inventoryLasted = inv
                            found = True
                            logger.warn(f'_create_inventory_by_day -> inv Inventory id {inv.id}')
                            logger.warn(f'_create_inventory_by_day -> inv Inventory name {inv.name}')
                            logger.warn(f'_create_inventory_by_day -> skip this data time {date}')
                            logger.warn('\n\n')
                            continue

                    if found == None:
                        if inventoryLasted != None:
                            priceDetailLasted = PriceDetail.objects.filter(inventory=inventoryLasted)
                            logger.info(f'_create_inventory_by_day -> Inventory list id {inventorylist.id}')
                            logger.info(f'_create_inventory_by_day -> Inventory id {inventoryLasted.id}')
                            logger.info(f'_create_inventory_by_day -> Inventory name {inventorylist.name}')
                            logger.info(f'_create_inventory_by_day-> migrate date time {date}')
                            self.create_inventory(inventoryLasted, date, priceDetailLasted)
                            logger.warn('\n')
                            count = count+1
                            continue
                        else:
                            befor_befor_yesterday = yesterday - datetime.timedelta(days=30)
                            inventoryLasted = Inventory.objects.filter(Q(name=inventorylist.name) & Q(create_date__lt=yesterday)).last()
                            priceDetailLasted = PriceDetail.objects.filter(inventory=inventoryLasted)
                            logger.info(f'_create_inventory_by_day -> Inventory list id {inventorylist.id}')
                            logger.info(f'_create_inventory_by_day -> Inventory id {inventoryLasted.id}')
                            logger.info(f'_create_inventory_by_day -> Inventory name {inventorylist.name}')
                            logger.info(f'_create_inventory_by_day-> migrate date time befor_befor_yesterday {date}')
                            self.create_inventory(inventoryLasted, date, priceDetailLasted)
                            logger.warn('\n')
                            count = count+1
                            continue



    @transaction.atomic
    def create_inventory(self, inventoryLasted, date, priceDetailLasted):
        inventory = Inventory.objects.create(
            project_name=inventoryLasted.project_name,
            name=inventoryLasted.name,
            job_code=inventoryLasted.job_code,
            data_center=inventoryLasted.data_center,
            application_name=inventoryLasted.application_name,
            total_price=inventoryLasted.total_price,
            power_state=inventoryLasted.power_state,
            resource_type=inventoryLasted.resource_type,
            power_state_point=inventoryLasted.power_state_point,
            create_date=date,
        )
        print ('create inventory',inventory.id)
        for priceDetail in priceDetailLasted:
            PriceDetail.objects.create(
                inventory=inventory,
                name=priceDetail.name,
                price=priceDetail.price,
                unit=priceDetail.unit,
                category=priceDetail.category,
            )