import React, { useEffect, useState } from "react";
import api from "@/api/axios";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  ShieldAlert,
} from "lucide-react";

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  id_role: number;
  active: boolean;
  role?: Role;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Estados de Búsqueda
  const [searchQuery, setSearchQuery] = useState("");

  // Estados de los Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Estados del Formulario
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    id_role: "",
    active: true,
  });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("");

  // Alertas
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    // Validar sesión y rol administrador
    const storedSession = localStorage.getItem("alltex_session");
    if (storedSession) {
      try {
        const userSession = JSON.parse(storedSession);
        if (userSession.id_role === 1 || userSession.role?.name?.toLowerCase() === "administrador") {
          setIsAdmin(true);
          loadData();
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/users/all"),
        api.get("/roles/all")
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error("Error cargando usuarios o roles:", error);
      triggerAlert("error", "Error al conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  const triggerAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Crear Usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        username: formData.username.trim(),
        password: formData.password,
        name: formData.name.trim(),
        id_role: parseInt(formData.id_role, 10),
        active: formData.active,
      };

      if (!payload.username || !payload.password || !payload.name || isNaN(payload.id_role)) {
        triggerAlert("error", "Por favor completa todos los campos.");
        setActionLoading(false);
        return;
      }

      await api.post("/users/create/admin", payload);
      triggerAlert("success", "Usuario creado exitosamente.");
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      const errMsg = error.response?.data?.message || "Error al crear el usuario.";
      triggerAlert("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Editar Usuario
  const handleEditClick = (user: User) => {
    setSelectedUserId(user.id);
    setFormData({
      username: user.username,
      password: "", // No mostramos la contraseña actual
      name: user.name,
      id_role: user.id_role.toString(),
      active: user.active,
    });
    setIsEditOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    setActionLoading(true);
    try {
      const payload: any = {
        username: formData.username.trim(),
        name: formData.name.trim(),
        id_role: parseInt(formData.id_role, 10),
        active: formData.active,
      };

      // Solo enviar contraseña si se introdujo una nueva
      if (formData.password.trim() !== "") {
        payload.password = formData.password;
      }

      await api.put(`/users/update/id/${selectedUserId}`, payload);
      triggerAlert("success", "Usuario actualizado exitosamente.");
      setIsEditOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error("Error actualizando usuario:", error);
      const errMsg = error.response?.data?.message || "Error al actualizar el usuario.";
      triggerAlert("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar Usuario
  const handleDeleteClick = (user: User) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.username);
    setIsDeleteOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) return;
    setActionLoading(true);
    try {
      await api.delete(`/users/delete/id/${selectedUserId}`);
      triggerAlert("success", "Usuario eliminado exitosamente.");
      setIsDeleteOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error eliminando usuario:", error);
      triggerAlert("error", "No se puede eliminar el usuario. Intenta desactivarlo en su lugar.");
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ username: "", password: "", name: "", id_role: "", active: true });
  };

  // Filtrado
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 pt-20">
        <ShieldAlert className="size-16 text-red-500/80" />
        <h2 className="text-2xl font-bold">Acceso Denegado</h2>
        <p className="text-muted-foreground">No tienes los permisos necesarios para ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-sm text-muted-foreground text-balance">
            Administra los accesos y permisos de tu equipo al sistema de inventario.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="w-fit bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-primary/20"
        >
          <Plus className="size-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Alertas */}
      {alert && (
        <div
          className={`flex gap-3 p-4 rounded-xl border shadow-lg max-w-2xl animate-in fade-in slide-in-from-top-3 duration-300 ${
            alert.type === "success"
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/35"
              : "bg-red-500/10 text-red-800 dark:text-red-200 border-red-500/35"
          }`}
        >
          {alert.type === "success" ? (
            <CheckCircle className="size-5 shrink-0 text-emerald-500" />
          ) : (
            <XCircle className="size-5 shrink-0 text-red-500" />
          )}
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      )}

      {/* Filtros */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="size-4" />
            </div>
            <Input
              type="text"
              placeholder="Buscar por nombre o usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full bg-transparent focus-visible:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Usuarios */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-7 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Cargando usuarios...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 font-semibold">Usuario</th>
                  <th className="p-4 font-semibold">Nombre Completo</th>
                  <th className="p-4 font-semibold">Rol</th>
                  <th className="p-4 font-semibold">Estado</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors duration-150">
                    <td className="p-4 font-mono font-medium text-foreground">{u.username}</td>
                    <td className="p-4 text-muted-foreground">{u.name}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {roles.find(r => r.id === u.id_role)?.name || "Desconocido"}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium text-xs">
                          <span className="size-2 rounded-full bg-muted-foreground/50" />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(u)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150"
                          title="Editar"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(u)}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all duration-150"
                          title="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8">
            <Users className="size-10 text-muted-foreground/35 mb-2" />
            <p className="text-sm font-semibold text-foreground">No se encontraron usuarios</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Agrega un nuevo miembro a tu equipo para darle acceso al sistema.
            </p>
          </div>
        )}
      </Card>

      {/* Modal: Crear Usuario */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Crear Nuevo Usuario">
        <form onSubmit={handleCreateUser} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nombre de Usuario</label>
              <Input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
                placeholder="Ej: admin01"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Contraseña</label>
              <Input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
                placeholder="********"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nombre Completo</label>
              <Input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Rol</label>
              <Select
                name="id_role"
                required
                value={formData.id_role}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              >
                <option value="">Selecciona Rol</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeCreate"
              name="active"
              checked={formData.active}
              onChange={handleInputChange}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="activeCreate" className="text-sm text-foreground font-medium cursor-pointer">
              Usuario Activo
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={actionLoading}
              className="bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center gap-1 cursor-pointer"
            >
              {actionLoading && <Loader2 className="size-4.5 animate-spin" />}
              Guardar Usuario
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal: Editar Usuario */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Usuario">
        <form onSubmit={handleUpdateUser} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nombre de Usuario</label>
              <Input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nueva Contraseña (Opcional)</label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
                placeholder="Dejar vacío para no cambiar"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nombre Completo</label>
              <Input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Rol</label>
              <Select
                name="id_role"
                required
                value={formData.id_role}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              >
                <option value="">Selecciona Rol</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeEdit"
              name="active"
              checked={formData.active}
              onChange={handleInputChange}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="activeEdit" className="text-sm text-foreground font-medium cursor-pointer">
              Usuario Activo
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={actionLoading}
              className="bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center gap-1 cursor-pointer"
            >
              {actionLoading && <Loader2 className="size-4.5 animate-spin" />}
              Actualizar Usuario
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal: Confirmar Eliminación */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Eliminar Usuario">
        <div className="space-y-4 pt-1">
          <p className="text-sm text-foreground">
            ¿Estás seguro de que deseas eliminar al usuario{" "}
            <span className="font-bold text-red-500">"{selectedUserName}"</span>? Esta acción es
            irreversible. Alternativamente, puedes simplemente desactivar su cuenta editando el perfil.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
            >
              {actionLoading && <Loader2 className="size-4.5 animate-spin" />}
              Confirmar Eliminación
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
