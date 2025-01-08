from django.core.exceptions import ValidationError
from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from .models import PLO, Processor, Item, Forecast
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if user is None:
            raise serializers.ValidationError('Invalid credentials')
        return {'user': user}

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email','is_staff')

class PLOSerializer(serializers.ModelSerializer):
    class Meta:
        model = PLO
        fields = '__all__'

class ProcessorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Processor
        fields = '__all__'

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = [
            'requested_date', 'flavour', 'sid', 'estimated_clients', 'delivered_clients',
            'bfs', 't_shirt_size', 'landscape', 'hardware', 'setup',
            'plo', 'processor1', 'processor2', 'status', 'description',
            'expected_delivery', 'revised_delivery_date', 'delivery_date',
            'delivery_delay_reason', 'servicenow', 'comments'
        ]




from django.shortcuts import get_object_or_404

class ForecastSerializer(serializers.ModelSerializer):
    item_sid = serializers.CharField(source='item.sid', read_only=True)  # Ensure it is included in the response

    class Meta:
        model = Forecast
        fields = [
            'id', 'sid', 'clients', 'bfs', 'system_description',
            'time_weeks', 'landscape', 'frontend', 'assigned_to',
            'requester', 'parallel_processing', 'cw_request_plo',
            'cw_delivered', 'comments', 'item_sid'  # Include item_sid in the response fields
        ]
    
    def validate_item_sid(self, value):
        if value:  # Only validate if item_sid is provided
            item = Item.objects.filter(sid=value).first()
            if not item:
                raise serializers.ValidationError(f"Item with SID '{value}' does not exist.")
        return value

    def create(self, validated_data):
        item_sid = validated_data.pop('item_sid', None)
        if item_sid:
            item = get_object_or_404(Item, sid=item_sid)
            validated_data['item'] = item
        assigned_to = validated_data.pop('assigned_to', None)

        forecast = Forecast.objects.create(assigned_to=assigned_to, **validated_data)
        return forecast

    def update(self, instance, validated_data):
        instance.sid = validated_data.get('sid', instance.sid)
        instance.clients = validated_data.get('clients', instance.clients)
        instance.bfs = validated_data.get('bfs', instance.bfs)
        instance.system_description = validated_data.get('system_description', instance.system_description)
        instance.time_weeks = validated_data.get('time_weeks', instance.time_weeks)
        instance.landscape = validated_data.get('landscape', instance.landscape)
        instance.frontend = validated_data.get('frontend', instance.frontend)
        instance.requester = validated_data.get('requester', instance.requester)
        instance.parallel_processing = validated_data.get('parallel_processing', instance.parallel_processing)
        instance.cw_request_plo = validated_data.get('cw_request_plo', instance.cw_request_plo)
        instance.cw_delivered = validated_data.get('cw_delivered', instance.cw_delivered)
        instance.comments = validated_data.get('comments', instance.comments)

        if 'item_sid' in validated_data:
            item_sid = validated_data.pop('item_sid')
            item = get_object_or_404(Item, sid=item_sid)
            instance.item = item
        
        instance.assigned_to = validated_data.get('assigned_to', instance.assigned_to)
        instance.save()
        return instance