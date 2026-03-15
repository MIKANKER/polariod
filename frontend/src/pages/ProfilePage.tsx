import { AppLayout } from '../components/layout';
import { useAuthStore } from '../stores/authStore';
import { User as UserIcon, Mail, Calendar, LogOut } from 'lucide-react';

export const ProfilePage = () => {
  const { user, logout } = useAuthStore();

  if (!user) {
    return null;
  }

  // Format creation date
  const createdDate = new Date(user.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Perfil de Usuario</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-24" />

          {/* Profile Content */}
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex justify-center -mt-12 mb-4">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-gray-400" />
              </div>
            </div>

            {/* User Information */}
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Correo electrónico</p>
                  <p className="text-base text-gray-900">{user.email}</p>
                </div>
              </div>

              {/* Account Creation Date */}
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Cuenta creada</p>
                  <p className="text-base text-gray-900">{createdDate}</p>
                </div>
              </div>

              {/* User ID */}
              <div className="flex items-start space-x-3">
                <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">ID de usuario</p>
                  <p className="text-base text-gray-900 font-mono text-sm break-all">
                    {user.id}
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
