import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Image, Wand2, User, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/gallery', label: 'Galería', icon: Image },
    { path: '/render', label: 'Generar Marco', icon: Wand2 },
    { path: '/profile', label: 'Perfil', icon: User },
  ];

  // Close menu on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 md:hidden
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-lg font-semibold text-gray-900">Menú</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">Conectado como</p>
          <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors
                min-h-[44px] min-w-[44px]
                ${
                  isActive(path)
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px]"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
};
