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
    <nav className="fixed bottom-0 left-0 w-full z-40 glass-dock rounded-t-[28px] pb-safe">
      <div className="flex justify-around items-center px-4 py-2.5 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[58px] py-1 px-2.5 rounded-2xl transition-all duration-300 relative group btn-tactile ${
                  isActive
                    ? 'text-[#6C4CF1] font-bold'
                    : 'text-[#64748B] hover:text-[#6C4CF1]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Subtle active background pill */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-b from-[#EDE9FE] to-[#F5F3FF] rounded-2xl -z-10 border border-[#DDD6FE]/80 shadow-[0_2px_8px_rgba(108,76,241,0.1)] animate-fadeIn" />
                  )}

                  <Icon
                    className={`w-5 h-5 mb-0.5 transition-all duration-300 ${
                      isActive
                        ? 'stroke-[2.5px] text-[#6C4CF1] scale-110 -translate-y-0.5'
                        : 'stroke-[1.8px] opacity-70 group-hover:opacity-100 group-hover:scale-105'
                    }`}
                  />
                  <span className={`text-[10px] tracking-tight ${isActive ? 'font-black' : 'font-medium'}`}>
                    {item.label}
                  </span>

                  {/* Active bottom glowing indicator dot */}
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-[#6C4CF1] shadow-[0_0_6px_#6C4CF1] mt-0.5" />
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

