# Price settings

Estimated price of resources can be set via admin console (https://dcloud.pttdigital/api/admin) by each item listed there will be matching with resource attributes that user select and sum up to be on price.

# Setting attributes

**description** Name of setting which can be any character, but must be unique in the system.

**resource type** Resource type that this setting affects. So far, there is 2 types can be chosen: *Virtual machine* and *Openshift project*

**matching attributes** JSON formatted field for matching the setting with resource attributes. If they are matched or matching attribute is null, this price will be included into calculation. For more information, see [example](#Example) 

**effect attributes** Attributes of resources that will be as unit of calculation. If effect attributes are more than one, all amount will be sum up as attributes. If effect attributes is none, unit will be "one".

**unit price** Unit price of this item in daily basis with 4 precision decimal point.

# Example
## Direct attributes - CPU Cost
For every virtual machine that has CPU, CPU will be charged as its amount in resource.

###Settings

**matching attributes**
```json
{"cpu": null}
```

**effect attributes**
```
cpu
```

**unit price**
```
10
```

###Calculation

If user request a virtual machine with CPU 4 vcores, this price will add up for **10 * 4 THB**.


## Multi-values in effect attributes - Disk cost
Some cost may effect more than one attributes

### Settings

**matching attributes**
```json
{
    "storage_tier": "silver",
    "protection_level": "p1"
}
```

**effect attributes**
```
OS Disk
Data Disk 1
Data Disk 2
```

**unit price**
```
10
```

###Calculation

This price will affects if and only if user request virtual machine with **storage tier as silver** and **protection level is P1**. The total unit is sum of OS Disk size, Data Disk 1 size and Data Disk 2 size. For example, if **OS Disk is 100GB and Data Disk 1 is 50GB**, the price will be **(100 + 50) * 10 THB**.


## Multiple matching values - Top up for high protection level.

For high protection level (Greater than or equal P2), the resource will be charged more as CPU and memory size.


### Settings

**matching attributes**
```json
{
    "protection_level": ["p0", "p1", "p2"]
}
```

**effect attributes**
```
CPU
Memory
```

**unit price**
```
5
```

###Calculation

This price will affects if and only if **Protection level greater than or equal P2 (either P2, P1 or P0)**. The total unit is sum of CPU and memory size. For example, if user request **protection level P1 with CPU 4 vCores and Memory 8 GB**, the price will be **(4 + 8) * 5 THB**

## None of effect attribute - OS License.

Some price does not need unit for calculation, but need to charge every machine that matches with its criteria.

### Settings

**matching attributes**
```json
{
    "os_type": "windows"
}
```

**effect attributes**
```
null
```

**unit price**
```
150
```

###Calculation

This price will affects if and only if **OS Type is windows** and it will charge **150 THB to every resources with specified OS Type.**

## Universal price - Support fee

This kind of price will charged to all resources.

### Settings

**matching attributes**
```json
null
```

**effect attributes**
```
null
```

**unit price**
```
200
```

###Calculation

**All virtual matchines will be charged for 200 THB**

