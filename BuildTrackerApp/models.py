from django.db import models
import datetime

class PLO(models.Model):
    def __str__(self):
        return self.name

    name = models.CharField(max_length=30)

class Processor(models.Model):
    def __str__(self):
        return self.name

    name = models.CharField(max_length=30)

class Item(models.Model):
    def __str__(self):
        return self.sid

    FLAVOUR_CHOICES = [
        ("S/4H Private", "S/4H Private"),
        ("S/4H Public", "S/4H Public"),
        ("S/4 Cloud", "S/4 Cloud"),
        ("S/4H OP", "S/4H OP")
    ]

    BFS_CHOICES = [
        ("Single", "Single"),
        ("Multi", "Multi")
    ]

    TSHIRT_SIZE_CHOICES = [
        ("Large", "Large"),
        ("Medium", "Medium"),
        ("Small", "Small")
    ]

    HARDWARE_CHOICES = [
        ("GCP", "GCP"),
        ("Azure", "Azure")
    ]

    STATUS_CHOICES = [
        ("Reviewing eCS", "Reviewing eCS"),
        ("Backup from source", "Backup from source"),
        ("OAT Simulation", "OAT Simulation"),
        ("Server Provisioning", "Server Provisioning"),
        ("DB Installation", "DB Installation"),
        ("Installation", "Installation"),
        ("Post Installation", "Post Installation"),
        ("Client 000 Customization", "Client 000 Customization"),
        ("with SLC for TMS", "with SLC for TMS"),
        ("Back from SLC", "Back from SLC"),
        ("Higher client customization", "Higher client customization"),
        ("Quality Checks", "Quality Checks"),
        ("Handedover to PLO", "Handedover to PLO"),
        ("REBUILD", "REBUILD"),
        ("Cancelled","Cancelled")
    ]

    requested_date = models.DateField()
    flavour = models.CharField(max_length=30, choices=FLAVOUR_CHOICES)
    sid = models.CharField(max_length=3)
    estimated_clients = models.IntegerField()
    delivered_clients = models.IntegerField(null=True, blank=True)  # New field
    bfs = models.CharField(max_length=10, choices=BFS_CHOICES)
    t_shirt_size = models.CharField(max_length=10, choices=TSHIRT_SIZE_CHOICES)
    system_type = models.CharField(max_length=300, )
    hardware = models.CharField(max_length=10, choices=HARDWARE_CHOICES)
    setup = models.CharField(max_length=100)  
    plo = models.ForeignKey(PLO, on_delete=models.CASCADE, related_name='plo_items')
    processor1 = models.ForeignKey(Processor, on_delete=models.CASCADE, related_name='processor1_items')
    processor2 = models.ForeignKey(Processor, on_delete=models.CASCADE, related_name='processor2_items', blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    landscape = models.CharField(max_length=300)
    description = models.CharField(max_length=500)
    expected_delivery = models.DateField()
    revised_delivery_date = models.DateField(blank=True,null = True)
    delivery_date = models.DateField(blank=True, default=datetime.date(9999, 12, 31))
    delivery_delay_reason = models.CharField(max_length=500, blank=True , null = True)
    servicenow = models.URLField(max_length=800, blank=True)
    comments = models.CharField(max_length=400,blank = True, null = True)

class Forecast(models.Model):
    def __str__(self):
        return f"{self.sid} - {self.clients} Clients"

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='forecasts')
    sid = models.CharField(max_length=3)
    clients = models.IntegerField()
    bfs = models.CharField(max_length=10, choices=Item.BFS_CHOICES)
    system_description = models.CharField(max_length=300)
    time_weeks = models.IntegerField()  # Time in weeks
    landscape = models.CharField(max_length=300)
    frontend = models.CharField(max_length=100)
    requester = models.ForeignKey(PLO, on_delete=models.SET_NULL, null=True, related_name='forecast_requester')
    parallel_processing = models.BooleanField(default=False)
    cw_request_plo = models.IntegerField()
    cw_delivered = models.IntegerField(null=True, blank=True)
    comments = models.CharField(max_length=400, blank=True, null=True)
