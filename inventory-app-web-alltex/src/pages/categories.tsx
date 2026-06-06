import React, { useEffect, useState } from "react";
import api from "@/api/axios";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tags,
} from "lucide-react";

interface Category {
  id: number;
  name: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Estados de Búsqueda
  const [searchQuery, setSearchQuery] = useState("");

  // Estados de los Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Estados del Formulario
  const [formData, setFormData] = useState({ name: "" });
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

  // Alertas
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/categories/all");
      setCategories(data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
      triggerAlert("error", "Error al conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ name: e.target.value });
  };

  // Crear Categoría
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = { name: formData.name.trim() };

      if (!payload.name) {
        triggerAlert("error", "El nombre de la categoría es requerido.");
        setActionLoading(false);
        return;
      }

      await api.post("/categories/create", payload);
      triggerAlert("success", "Categoría creada exitosamente.");
      setIsCreateOpen(false);
      setFormData({ name: "" });
      loadData();
    } catch (error: any) {
      console.error("Error al crear categoría:", error);
      const errMsg = error.response?.data?.message || "Error al crear la categoría.";
      triggerAlert("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Editar Categoría
  const handleEditClick = (category: Category) => {
    setSelectedCategoryId(category.id);
    setFormData({ name: category.name });
    setIsEditOpen(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) return;

    setActionLoading(true);
    try {
      const payload = { name: formData.name.trim() };
      await api.put(`/categories/update/id/${selectedCategoryId}`, payload);
      triggerAlert("success", "Categoría actualizada exitosamente.");
      setIsEditOpen(false);
      setFormData({ name: "" });
      loadData();
    } catch (error: any) {
      console.error("Error actualizando categoría:", error);
      const errMsg = error.response?.data?.message || "Error al actualizar la categoría.";
      triggerAlert("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar Categoría
  const handleDeleteClick = (category: Category) => {
    setSelectedCategoryId(category.id);
    setSelectedCategoryName(category.name);
    setIsDeleteOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategoryId) return;
    setActionLoading(true);
    try {
      await api.delete(`/categories/delete/id/${selectedCategoryId}`);
      triggerAlert("success", "Categoría eliminada exitosamente.");
      setIsDeleteOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error eliminando categoría:", error);
      triggerAlert("error", "No se puede eliminar la categoría porque puede estar en uso.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrado
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Categorías</h1>
          <p className="text-sm text-muted-foreground text-balance">
            Administra las categorías de tus productos para mantener tu inventario organizado.
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({ name: "" });
            setIsCreateOpen(true);
          }}
          className="w-fit bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-primary/20"
        >
          <Plus className="size-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Alertas */}
      {alert && (
        <div
          className={`flex gap-3 p-4 rounded-xl border shadow-lg max-w-2xl animate-in fade-in slide-in-from-top-3 duration-300 ${alert.type === "success"
            ? "bg-emerald-500/10 text-white-900 dark:text-black-900 border-emerald-500/35"
            : "bg-red-500/10 text-red-900 dark:text-red-200 border-red-500/35"
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
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full bg-transparent focus-visible:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Categorías */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-7 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Cargando categorías...</p>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 font-semibold w-16 text-center">ID</th>
                  <th className="p-4 font-semibold">Nombre de la Categoría</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors duration-150">
                    <td className="p-4 text-center font-mono text-muted-foreground">{c.id}</td>
                    <td className="p-4 font-semibold text-foreground">{c.name}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(c)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150"
                          title="Editar"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(c)}
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
            <Tags className="size-10 text-muted-foreground/35 mb-2" />
            <p className="text-sm font-semibold text-foreground">No se encontraron categorías</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Agrega una nueva categoría para comenzar a organizar tus productos.
            </p>
          </div>
        )}
      </Card>

      {/* Modal: Crear Categoría */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Crear Categoría">
        <form onSubmit={handleCreateCategory} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Nombre de la Categoría</label>
            <Input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="bg-transparent text-foreground"
              placeholder="Ej: Ropa, Electrónica..."
            />
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
              Guardar Categoría
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal: Editar Categoría */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Categoría">
        <form onSubmit={handleUpdateCategory} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Nombre de la Categoría</label>
            <Input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="bg-transparent text-foreground"
            />
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
              Actualizar
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal: Confirmar Eliminación */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Eliminar Categoría">
        <div className="space-y-4 pt-1">
          <p className="text-sm text-foreground">
            ¿Estás seguro de que deseas eliminar la categoría{" "}
            <span className="font-bold text-red-500">"{selectedCategoryName}"</span>? Esta acción no se puede deshacer.
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
              onClick={handleDeleteCategory}
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
