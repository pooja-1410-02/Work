from django.contrib import admin
from .models import Item, Processor, PLO
# from rest_framework.authtoken.models import Token
# Register your models here.

admin.site.register(Processor)
admin.site.register(Item)
admin.site.register(PLO)


