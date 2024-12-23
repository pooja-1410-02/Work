# Django and Django REST Framework imports
from django.contrib.auth import authenticate, get_user_model, update_session_auth_hash, logout
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from rest_framework import generics, status, permissions, serializers, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenViewBase
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from django.contrib import messages
import pandas as pd
from django.shortcuts import render, redirect


# Local imports
from .models import PLO, Processor, Item,Forecast
from .serializers import (
    PLOSerializer, ProcessorSerializer, ItemSerializer,
    UserRegisterSerializer, UserLoginSerializer, UserSerializer, ForecastSerializer
)


# Other imports
import json
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


User = get_user_model()


import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from .utils import send_status_update_email

@api_view(['POST'])
def send_email_notification(request):
    sid = request.data.get('sid')
    status_value = request.data.get('status')
    item_details = request.data.get('itemDetails')

    if not sid or not status_value or not item_details:
        return Response({"error": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        send_status_update_email(sid, status_value, item_details)
    except Exception as e:
        print(f"Error sending email: {e}")
        return Response({"error": "Failed to send email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({"message": "Email sent successfully"}, status=status.HTTP_200_OK)

class UpdateUserStaffStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        username = data.get('username')
        is_staff = data.get('is_staff')

        if username is None or is_staff is None:
            return Response({'error': 'Username and is_staff status are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the requesting user is a superuser (admin) or is the user 'admin'
        if not request.user.is_superuser and request.user.username != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            # Attempt to retrieve the user object
            user = User.objects.get(username=username)
            # Update the is_staff status
            user.is_staff = is_staff
            user.save()
            return Response({'message': 'User staff status updated successfully'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)

# @login_required
@require_http_methods(["GET"])
def list_users(request):
    users = User.objects.all().values('username', 'email', 'first_name', 'last_name', 'is_staff')
    return JsonResponse(list(users), safe=False)

@csrf_exempt
@require_http_methods(["POST"])  # Ensure only POST requests are allowed
def update_user(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        old_password = data.get('oldPassword')
        new_username = data.get('newUsername')
        new_password = data.get('newPassword')
        new_email = data.get('newEmail')

        if not username or not old_password:
            return JsonResponse({'error': 'Username and old password are required'}, status=400)

        user = authenticate(username=username, password=old_password)
        if user is None:
            return JsonResponse({'error': 'Invalid username or password'}, status=400)

        if new_username:
            user.username = new_username
        if new_email:
            user.email = new_email
        if new_password:
            user.set_password(new_password)
            update_session_auth_hash(request, user)

        user.save()
        return JsonResponse({'message': 'User details updated successfully'}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

@csrf_exempt
@require_http_methods(["DELETE"])  # Ensure only DELETE requests are allowed
def delete_user(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        old_password = data.get('oldPassword')

        if not username or not old_password:
            return JsonResponse({'error': 'Username and old password are required'}, status=400)

        user = authenticate(username=username, password=old_password)
        if user is None:
            return JsonResponse({'error': 'Invalid username or password'}, status=400)

        user.delete()
        return JsonResponse({'message': 'User deleted successfully'}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_object(self):
        return self.request.user

    def put(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)  # `partial=True` allows partial updates
        serializer.is_valid(raise_exception=True)
        
        # Handle password update separately
        if 'password' in serializer.validated_data:
            password = serializer.validated_data['password']
            user.password = make_password(password)
            user.save()
            # Remove password from validated_data to prevent it from being updated again
            del serializer.validated_data['password']
        
        # Save other user fields
        serializer.save()
        
        return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return only the logged-in user
        return User.objects.filter(id=self.request.user.id)

    def update(self, request, *args, **kwargs):
        # Custom update logic, if necessary
        return super().update(request, *args, **kwargs)



class UserRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

class UserLoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        return Response({
            'refresh': str(refresh),
            'access': access_token
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
def user_logout(request):
    try:
        print('request.data')
        # print('request.data', request.data)
        refresh_token = request.data.get('refresh_token')
        print('Refresh token: ',refresh_token)
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()  # Blacklist the refresh token
                return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"Error blacklisting token: {e}")
                return Response({"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"message": "No refresh token provided"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Error in logout view: {e}")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





class PLOViewSet(viewsets.ModelViewSet):
    serializer_class = PLOSerializer
    queryset = PLO.objects.all()

class ProcessorViewSet(viewsets.ModelViewSet):
    serializer_class = ProcessorSerializer
    queryset = Processor.objects.all()

class ItemViewSet(viewsets.ModelViewSet):
    serializer_class = ItemSerializer
    queryset = Item.objects.all()
    lookup_field = 'sid'

    def update(self, request, *args, **kwargs):
        partial = request.data.get('partial', False)  # Check if partial update
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        # Validate the incoming data
        serializer.is_valid(raise_exception=True)
        
        # Perform the update
        self.perform_update(serializer)

        return Response(serializer.data)
    
class ForecastViewSet(viewsets.ModelViewSet):
    serializer_class = ForecastSerializer
    queryset = Forecast.objects.all()
def parse_date(date_value):
    """Convert a date value to a Python date, handling NaT and errors."""
    if pd.notna(date_value):
        try:
            # Attempt to parse the date in DD/MM/YYYY format
            return pd.to_datetime(date_value, format='%d/%m/%Y', errors='coerce').date()
        except Exception as e:
            logger.error(f"Date conversion error for value {date_value}: {e}")
            return None
    return None
import datetime
@api_view(['POST'])
def upload_excel(request):
    if not request.FILES.get('file'):
        logger.error("No file provided in the request.")
        return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        excel_file = request.FILES['file']
        file_extension = excel_file.name.split('.')[-1].lower()

        if file_extension not in ['xlsx', 'xls']:
            logger.error("Invalid file format: %s", file_extension)
            return Response({"error": "Invalid file format. Please upload an .xls or .xlsx file."}, status=status.HTTP_400_BAD_REQUEST)

        df = pd.read_excel(excel_file, engine='openpyxl' if file_extension == 'xlsx' else 'xlrd')
        logger.info(f"DataFrame contents: {df.head()}")

        processor_mapping = {processor.name: processor.id for processor in Processor.objects.all()}
        plo_mapping = {plo.name: plo.id for plo in PLO.objects.all()}

        for index, row in df.iterrows():
            if not row['sid'] or not row['requested_date']:
                logger.error("Missing required fields in row: %s", row)
                return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

            requested_date = parse_date(row['requested_date'])
            expected_delivery = parse_date(row['expected_delivery'])
            revised_delivery_date = parse_date(row['revised_delivery_date'])

            if requested_date is None:
                logger.error(f"Invalid requested_date at row {index}: {row['requested_date']}")
                return Response({"error": "Invalid requested_date."}, status=status.HTTP_400_BAD_REQUEST)

            processor1_instance_id = processor_mapping.get(row['processor1'])
            processor2_instance_id = processor_mapping.get(row['processor2']) if row['processor2'] else None

            if processor1_instance_id is None:
                logger.error("Invalid processor1 ID: %s", row['processor1'])
                return Response({"error": "Invalid processor1 ID."}, status=status.HTTP_400_BAD_REQUEST)

            processor1_instance = Processor.objects.get(id=processor1_instance_id)
            processor2_instance = Processor.objects.get(id=processor2_instance_id) if processor2_instance_id else None

            plo_name = row.get('plo')
            plo_id = plo_mapping.get(plo_name)

            if plo_id is None:
                logger.error(f"Invalid PLO name: {plo_name} at row {index}")
                return Response({"error": f"PLO '{plo_name}' not found."}, status=status.HTTP_400_BAD_REQUEST)

            item = Item(
                requested_date=requested_date,
                flavour=row['flavour'],
                sid=row['sid'],
                estimated_clients=row['estimated_clients'],
                delivered_clients=row['delivered_clients'],
                bfs=row['bfs'],
                t_shirt_size=row['t_shirt_size'],
                system_type=row['system_type'],
                hardware=row['hardware'],
                setup=row['setup'],
                plo_id=plo_id,  # This will now always be valid
                processor1=processor1_instance,
                processor2=processor2_instance,
                status=row['status'],
                landscape=row['landscape'],
                description=row['description'],
                expected_delivery=expected_delivery,
                revised_delivery_date=revised_delivery_date,
                delivery_date=row.get('delivery_date', datetime.date(9999, 12, 31)),
                delivery_delay_reason=row.get('delivery_delay_reason', None),
                servicenow=row.get('servicenow', ''),
                comments=row.get('comments', ''),
            )
            item.save()

        return Response({"message": "Excel data uploaded successfully."}, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error processing the file: {e}")
        return Response({"error": "Failed to upload data."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
