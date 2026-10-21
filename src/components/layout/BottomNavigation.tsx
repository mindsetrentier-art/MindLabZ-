import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, PenLine, Gamepad2, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navItems = [
    { to: '/', label: '探索', icon: Home },
    { to: '/learn', label: '定律库', icon: BookOpen },
    { to: '/journal', label: '心智手记', icon: PenLine },
    { to: '/games', label: '竞技场', icon: Gamepad2 },
    { to: '/profile', label: '我的', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto glass-dock pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-all">
      <div className="flex justify-around items-center px-2 sm:px-6 md:px-10 lg:px-12 py-1.5 sm:py-2.5 max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[50px] sm:min-w-[56px] min-h-[44px] py-1 px-2 sm:px-3 rounded-xl transition-all duration-150 relative group active:scale-95 touch-manipulation ${
                  isActive
                    ? 'text-stone-900 font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${
                      isActive
                        ? 'stroke-[2.2px] text-stone-900 -translate-y-0.5'
                        : 'stroke-[1.6px] text-stone-400 group-hover:text-stone-700'
                    }`}
                  />
                  <span
                    className={`text-[10px] tracking-tight whitespace-nowrap ${
                      isActive ? 'font-bold text-stone-900' : 'font-medium text-stone-500'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Restrained Editorial Active Indicator (Quiet 3px Ink Dot) */}
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-stone-900 mt-0.5" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

