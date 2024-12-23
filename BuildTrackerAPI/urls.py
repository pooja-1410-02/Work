from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenBlacklistView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from BuildTrackerApp.views import (
    PLOViewSet, 
    ProcessorViewSet, 
    ItemViewSet, 
    ForecastViewSet,
    UserRegisterView,
    UserLoginView,
    user_logout,
    UserViewSet,
    UserDetailView,
    list_users,
    update_user,
    delete_user,
    UpdateUserStaffStatusView,
    send_email_notification,
    upload_excel,
)


# Create a router and register viewsets with it
router = DefaultRouter()
router.register(r'plo', PLOViewSet, basename='plo')
router.register(r'processor', ProcessorViewSet, basename='processor')
router.register(r'item', ItemViewSet, basename='item')
router.register(r'forecast', ForecastViewSet, basename='forecast')

urlpatterns = [
    path('api/', include(router.urls)),  # Includes viewset routes
    path('register/', UserRegisterView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', TokenBlacklistView.as_view(), name='token_blacklist'),  
    path('users/', list_users, name='list_users'),
    path('update_user/', update_user, name='update_user'),
    path('delete_user/', delete_user, name='delete_user'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('user/', UserDetailView.as_view(), name='user_detail'),
    path('update_staff_status/', UpdateUserStaffStatusView.as_view(), name='update-user-staff-status'),
    path('api/send-email/', send_email_notification, name='send_email'),
    path('upload-excel/', upload_excel, name='excel_upload'),
]
