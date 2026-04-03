from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .serializers import UserSerializer, ChangePasswordSerializer, GoogleAuthSerializer

User = get_user_model()


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the current user's profile."""
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Change the current user's password."""

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class GoogleLoginView(APIView):
    """Authenticate user with Google OAuth ID token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']

        try:
            google_client_id = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']
            idinfo = id_token.verify_oauth2_token(
                token, google_requests.Request(), google_client_id
            )

            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            avatar_url = idinfo.get('picture', '')

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )

            if created:
                user.set_unusable_password()
                user.save()

            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data,
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response(
                {'detail': 'Invalid Google token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class RegisterView(APIView):
    """Register a new user with email and password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        username = request.data.get('username', '')

        if not email or not password:
            return Response(
                {'detail': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'detail': 'A user with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not username:
            username = email.split('@')[0]

        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Login with email and password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        print(email, password)

        if not email or not password:
            return Response(
                {'detail': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
            print(user,"<-user")
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            print("password is wrong")
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        print(user_data,"<-user_data")

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data,
        }, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    """Send a password reset code to the user's email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Return success even if user doesn't exist (security)
            return Response({'detail': 'If an account exists with this email, a reset code has been sent.'})

        # Generate 6-digit code and store in user model
        code = get_random_string(length=6, allowed_chars='0123456789')
        user.reset_code = code
        user.save(update_fields=['reset_code'])

        # Send email
        try:
            send_mail(
                subject='Expense Tracker - Password Reset Code',
                message=f'Your password reset code is: {code}\n\nThis code will expire when used. If you did not request this, please ignore this email.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            # If email fails, still return the code in response for development
            return Response({
                'detail': 'Email service not configured. Use the code below for development.',
                'dev_code': code,
            })

        return Response({'detail': 'If an account exists with this email, a reset code has been sent.'})


class ResetPasswordView(APIView):
    """Reset password using the code sent via email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('new_password')

        if not all([email, code, new_password]):
            return Response({'detail': 'Email, code, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email, reset_code=code)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid code or email.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.reset_code = ''
        user.save()

        return Response({'detail': 'Password has been reset successfully. Please login.'})
