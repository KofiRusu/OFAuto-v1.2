'use client';

import { useState } from 'react';
import { UserRole, setMockUserByRole, getCurrentMockUser, mockLogout } from '../../mocks/auth/mock-auth';
import { Button } from '@/components/ui/button';

/**
 * Developer Role Switcher Component
 * Allows switching between different user roles during development
 */
export function DevRoleSwitcher() {
  const [currentUser, setCurrentUser] = useState(getCurrentMockUser());
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const handleRoleChange = (role: UserRole) => {
    const user = setMockUserByRole(role);
    setCurrentUser(user);
    // In a real app, we would use router.refresh() here
    window.location.reload();
  };
  
  const handleLogout = () => {
    mockLogout();
    setCurrentUser(getCurrentMockUser());
    // In a real app, we would use router.refresh() here
    window.location.reload();
  };
  
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg opacity-80 hover:opacity-100 transition-opacity">
      <div className="mb-2 text-xs">
        <span>DEV MODE</span>
        <span className="ml-2 px-2 py-1 rounded-md bg-blue-600">{currentUser.name}</span>
        <span className="ml-1 px-2 py-1 rounded-md border border-white text-xs">{currentUser.role}</span>
      </div>
      
      <div className="flex gap-1">
        <Button 
          size="sm" 
          variant={currentUser.role === UserRole.USER ? "default" : "outline"}
          onClick={() => handleRoleChange(UserRole.USER)}
        >
          USER
        </Button>
        <Button 
          size="sm" 
          variant={currentUser.role === UserRole.MANAGER ? "default" : "outline"}
          onClick={() => handleRoleChange(UserRole.MANAGER)}
        >
          MANAGER
        </Button>
        <Button 
          size="sm" 
          variant={currentUser.role === UserRole.ADMIN ? "default" : "outline"}
          onClick={() => handleRoleChange(UserRole.ADMIN)}
        >
          ADMIN
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
} 