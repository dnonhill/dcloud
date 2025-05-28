from collections import namedtuple
from pyVmomi import vim

from .tools import service_instance, pchelper


Args = namedtuple('Args', ('host', 'user', 'password',
                  'port', 'disable_ssl_verification', 'vm_name'))


class ServiceInstance:

    def __init__(self, host):
        self._args = Args('grp-cfvc-p01.pttgrp.corp',
                          'administrator@vsphere.local', 'NetApp123!', '443', True, host)
        self._si = service_instance.connect(self._args)
        self._content = self._si.RetrieveContent()


class PerformanceManager(ServiceInstance):

    def __init__(self, host):
        super().__init__(host)
        self._perf_manager = self._content.perfManager


class CollectUptimeBetween(PerformanceManager):

    def __init__(self, host, start_time, end_time):
        super().__init__(host)
        self.start_time = start_time
        self.end_time = end_time

    def __call__(self):
        vm = pchelper.get_obj(
            self._content, [vim.VirtualMachine], self._args.vm_name)
        metric_ids = [vim.PerformanceManager.MetricId(
            counterId=155, instance="*")]
        spec = vim.PerformanceManager.QuerySpec(maxSample=1,
                                                format='csv',
                                                entity=vm,
                                                metricId=metric_ids,
                                                startTime=self.start_time,
                                                endTime=self.end_time)
        result_stats = self._perf_manager.QueryStats(querySpec=[spec])

        # Make date column
        data = result_stats[0].sampleInfoCSV
        parts = data.split(',')
        date_column = parts[1::2]

        # Make value column
        try:
            data = result_stats[0].value[0].value
            value_column = [int(x) for x in data.split(',')]
        except IndexError:
            value_column = [0]

        combined_list = list(zip(date_column, value_column))
        return combined_list
