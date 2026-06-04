import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { KeyRound, User, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard if session already exists
  useEffect(() => {
    const session = localStorage.getItem("alltex_session");
    if (session) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Por favor ingresa usuario y contraseña.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/users/login", {
        username: username.trim(),
        password: password
      });

      if (response.data) {
        localStorage.setItem("alltex_session", JSON.stringify(response.data));
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      console.error("Login request error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Error de conexión con el servidor. Verifica que el servidor de la API esté activo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[35rem] h-[35rem] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Login Card */}
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative z-10 text-white transition-all duration-300">
        <CardHeader className="space-y-2.5 pb-6 text-center">
          <div className="mx-auto size-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/25 shadow-inner">
            <KeyRound className="size-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white mt-3">Alltex Gestor de Inventario</CardTitle>
            <CardDescription className="text-slate-400 text-sm mt-1">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex gap-2.5 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 text-sm animate-in fade-in slide-in-from-top-1.5 duration-200">
                <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="size-4" />
                </div>
                <Input
                  type="text"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="size-4" />
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500"
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex flex-col">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </Button>
            <p className="text-[11px] text-slate-500 text-center mt-4">
              Alltex Distribuidora &copy; {new Date().getFullYear()}
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
