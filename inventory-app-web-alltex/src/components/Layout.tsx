import { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router";
import { LayoutDashboard, Package, LogOut, Menu, X, Moon, Sun, ChevronDown, Tags, Users } from "lucide-react";

interface UserSession {
  id: number;
  username: string;
  name: string;
  id_role: number;
  role?: {
    name: string;
  };
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Authentication check
  useEffect(() => {
    const storedUser = localStorage.getItem("alltex_session");
    if (!storedUser) {
      navigate("/login", { replace: true });
    } else {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("alltex_session");
        navigate("/login", { replace: true });
      }
    }
  }, [navigate]);

  // Dark mode initial sync
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") ||
      localStorage.getItem("theme") === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("alltex_session");
    navigate("/login", { replace: true });
  };

  const baseMenuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Inventario",
      path: "/inventory",
      icon: Package,
    },
    {
      name: "Categorías",
      path: "/categories",
      icon: Tags,
    },
  ];

  const menuItems = user?.id_role === 1 || user?.role?.name?.toLowerCase() === "administrador"
    ? [...baseMenuItems, { name: "Usuarios", path: "/users", icon: Users }]
    : baseMenuItems;

  const getPageTitle = () => {
    const currentItem = menuItems.find((item) => item.path === location.pathname);
    return currentItem ? currentItem.name : "Alltex Inventory";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card shadow-sm z-30">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-border gap-2.5">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
            A
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">Alltex</h1>
            <span className="text-xs text-muted-foreground font-medium">Control de Inventario</span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <Icon className="size-4.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Quick Info */}
        <div className="p-4 border-t border-border flex items-center gap-3">
          <div className="size-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.role?.name || "Administrador"}</p>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile Toggle Menu */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Mobile menu container */}
          <aside className="relative flex flex-col w-64 bg-card border-r border-border p-4 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  A
                </div>
                <h1 className="font-bold text-sm">Alltex Inventory</h1>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    <Icon className="size-4.5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-border mt-auto flex items-center gap-3">
              <div className="size-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.role?.name || "Administrador"}</p>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Menu className="size-5" />
            </button>
            <h2 className="text-lg font-semibold tracking-tight">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Cambiar tema"
            >
              {isDarkMode ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-all duration-200 text-left"
              >
                <div className="size-7.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs border border-primary/20">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium pr-1">{user.username}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2.5 py-2 border-b border-border mb-1.5">
                    <p className="text-sm font-semibold truncate leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">@{user.username}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.8 text-sm text-destructive hover:bg-destructive/10 rounded-md font-medium transition-colors"
                  >
                    <LogOut className="size-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard or Page body wrapper */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-background/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
