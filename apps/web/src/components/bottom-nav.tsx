'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Users, Settings } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  
  // Ocultar navbar em certas rotas
  const hiddenRoutes = ['/', '/login', '/register'];
  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  const navItems = [
    {
      href: '/games',
      icon: Gamepad2,
      label: 'Jogos'
    },
    {
      href: '/children',
      icon: Users,
      label: 'Crianças'
    },
    {
      href: '/settings',
      icon: Settings,
      label: 'Config'
    }
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      aria-label="Navegação principal"
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[80px]
                transition-colors
                ${isActive 
                  ? 'text-primary-600' 
                  : 'text-gray-600 hover:text-primary-500'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
