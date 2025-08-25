import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogIn, UserPlus, LogOut, Settings, UserIcon, LayoutGrid, Package, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import isAdmin from '@/utils/isAdmin';

const UserDropdown = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="bg-sage rounded-full shadow w-10 h-10 flex items-center justify-center">
          <User className="h-5 w-5 text-white" />
          {isAuthenticated && (
            <span className="absolute -top-1 -right-1 bg-white text-orange-500 text-xs rounded-full h-2 w-2"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        {loading ? (
          <DropdownMenuLabel className="text-center">Loading...</DropdownMenuLabel>
        ) : isAuthenticated ? (
          // Authenticated user menu
          <>
            <DropdownMenuLabel className="font-sans">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            {isAdmin(user?.role) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Admin Panel</DropdownMenuLabel>
                {/* Link to the new Admin Overview page */}
                <DropdownMenuItem asChild>
                  <Link to="/admin/overview" className="flex items-center cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Overview</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/category" className="flex items-center cursor-pointer">
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    <span>Manage Categories</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/product" className="flex items-center cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>Manage Products</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </>
        ) : (
          // Non-authenticated user menu
          <>
            <DropdownMenuLabel className="font-sans">Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/login" className="flex items-center cursor-pointer">
                <LogIn className="mr-2 h-4 w-4" />
                <span>Login</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/register" className="flex items-center cursor-pointer">
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Register</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;  