import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Gamepad2, HelpCircle, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navItems = [
    { to: '/', label: '探索', icon: Home },
    { to: '/learn', label: '定律库', icon: BookOpen },
    { to: '/games', label: '竞技场', icon: Gamepad2 },
    { to: '/quiz', label: '快问答', icon: HelpCircle },
    { to: '/profile', label: '我的', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-dock backdrop-blur-[20px] rounded-t-[28px] pb-safe transition-all">
      <div className="flex justify-around items-center px-4 py-2 max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[60px] min-h-[46px] py-1 px-3 rounded-2xl transition-all duration-200 relative group btn-tactile ${
                  isActive
                    ? 'text-[#532CD8] font-bold'
                    : 'text-[#64748B]/90 hover:text-[#6C4CF1]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Translucent active glass pill with discreet 30s chameleon border & tint */}
                  {isActive && (
                    <div className="absolute inset-0 backdrop-blur-md rounded-2xl -z-10 chameleon-pill-active animate-fadeIn" />
                  )}

                  <Icon
                    className={`w-5 h-5 mb-0.5 transition-all duration-200 ${
                      isActive
                        ? 'stroke-[2.4px] chameleon-text scale-105 -translate-y-0.5'
                        : 'stroke-[1.8px] opacity-75 group-hover:opacity-100 group-hover:scale-105'
                    }`}
                  />
                  <span className={`text-[10px] tracking-tight whitespace-nowrap ${isActive ? 'font-extrabold chameleon-text' : 'font-medium'}`}>
                    {item.label}
                  </span>

                  {/* Active bottom glowing indicator dot */}
                  {isActive && (
                    <span className="w-1 h-1 rounded-full chameleon-dot mt-0.5" />
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

