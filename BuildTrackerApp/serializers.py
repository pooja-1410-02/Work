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
    # Write-only field for item; we'll set it based on the sid
    item_sid = serializers.CharField(write_only=True)

    class Meta:
        model = Forecast
        fields = [
            'id', 'sid', 'clients', 'bfs', 'system_description',
            'time_weeks', 'landscape', 'frontend',
            'requester', 'parallel_processing',
            'cw_request_plo', 'cw_delivered', 'comments',
            'item_sid'  # The SID for the item
        ]
    
    def validate_item_sid(self, value):
        # Ensure that an Item exists with the given sid
        item = Item.objects.filter(sid=value).first()
        if not item:
            raise serializers.ValidationError(f"Item with SID '{value}' does not exist.")
        return item

    def create(self, validated_data):
        # Retrieve the item SID and find the corresponding item
        item_sid = validated_data.pop('item_sid')
        item = get_object_or_404(Item, sid=item_sid)

        # Create and return the Forecast instance
        forecast = Forecast.objects.create(item=item, **validated_data)
        return forecast

    def update(self, instance, validated_data):
        # Update fields with validated data
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

        # If item_sid is provided, update the item
        if 'item_sid' in validated_data:
            item_sid = validated_data.pop('item_sid')
            instance.item = get_object_or_404(Item, sid=item_sid)
        
        instance.save()
        return instance


