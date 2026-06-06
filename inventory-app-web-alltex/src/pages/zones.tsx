import React, { useEffect, useState, useCallback } from "react";
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
  MapPin,
} from "lucide-react";

interface Zone {
  id: number;
  name: string;
}

export default function Zones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedZoneName, setSelectedZoneName] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const triggerAlert = useCallback((type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const { data } = await api.get("/zones/all");
      setZones(data);
    } catch (error) {
      console.error(error);
      triggerAlert("error", "Error al conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  }, [triggerAlert]);

  useEffect(() => {
    let active = true;
    api.get("/zones/all")
      .then(({ data }) => {
        if (active) {
          setZones(data);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error(error);
        if (active) {
          triggerAlert("error", "Error al conectar con la base de datos.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [triggerAlert]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ name: e.target.value });
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = { name: formData.name.trim() };
      if (!payload.name) {
        triggerAlert("error", "El nombre de la zona es requerido.");
        setActionLoading(false);
        return;
      }
      await api.post("/zones/create", payload);
      triggerAlert("success", "Zona creada exitosamente.");
      setIsCreateOpen(false);
      setFormData({ name: "" });
      loadData();
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      const errMsg = err.response?.data?.message || "Error al crear la zona.";
      triggerAlert("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (zone: Zone) => {
    setSelectedZoneId(zone.id);
    setFormData({ name: zone.name });
    setIsEditOpen(true);
  };

  const handleUpdateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZoneId) return;
    setActionLoading(true);
    try {
      const payload = { name: formData.name.trim() };
      await api.put(`/zones/update/id/${selectedZoneId}`, payload);
      triggerAlert("success", "Zona actualizada exitosamente.");
      setIsEditOpen(false);
      setFormData({ name: "" });
      loadData();
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      const errMsg = err.response?.data?.message || "Error al actualizar la zona.";
      triggerAlert("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (zone: Zone) => {
    setSelectedZoneId(zone.id);
    setSelectedZoneName(zone.name);
    setIsDeleteOpen(true);
  };

  const handleDeleteZone = async () => {
    if (!selectedZoneId) return;
    setActionLoading(true);
    try {
      await api.delete(`/zones/delete/id/${selectedZoneId}`);
      triggerAlert("success", "Zona eliminada exitosamente.");
      setIsDeleteOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      triggerAlert("error", "No se puede eliminar la zona porque puede estar en uso.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredZones = zones.filter((z) =>
    z.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Zonas</h1>
          <p className="text-sm text-muted-foreground text-balance">
            Administra las zonas de almacenamiento o distribución asociadas a los proveedores.
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
          Nueva Zona
        </Button>
      </div>

      {alert && (
        <div
          className={`flex gap-3 p-4 rounded-xl border shadow-lg max-w-2xl animate-in fade-in slide-in-from-top-3 duration-300 ${
            alert.type === "success"
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

      <Card className="overflow-hidden border-border bg-card shadow-sm">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-7 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Cargando zonas...</p>
          </div>
        ) : filteredZones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 font-semibold w-16 text-center">ID</th>
                  <th className="p-4 font-semibold">Nombre de la Zona</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredZones.map((z) => (
                  <tr key={z.id} className="hover:bg-muted/30 transition-colors duration-150">
                    <td className="p-4 text-center font-mono text-muted-foreground">{z.id}</td>
                    <td className="p-4 font-semibold text-foreground">{z.name}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(z)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150"
                          title="Editar"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(z)}
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
            <MapPin className="size-10 text-muted-foreground/35 mb-2" />
            <p className="text-sm font-semibold text-foreground">No se encontraron zonas</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Agrega una nueva zona para comenzar a organizar a tus proveedores.
            </p>
          </div>
        )}
      </Card>

      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Crear Zona">
        <form onSubmit={handleCreateZone} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Nombre de la Zona</label>
            <Input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="bg-transparent text-foreground"
              placeholder="Ej: Zona Norte, Almacén Principal..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={actionLoading}
              className="bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center gap-1"
            >
              {actionLoading && <Loader2 className="size-4.5 animate-spin" />}
              Guardar Zona
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Zona">
        <form onSubmit={handleUpdateZone} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Nombre de la Zona</label>
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
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={actionLoading}
              className="bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center gap-1"
            >
              {actionLoading && <Loader2 className="size-4.5 animate-spin" />}
              Actualizar
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Eliminar Zona">
        <div className="space-y-4 pt-1">
          <p className="text-sm text-foreground">
            ¿Estás seguro de que deseas eliminar la zona{" "}
            <span className="font-bold text-red-500">"{selectedZoneName}"</span>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteZone}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-1"
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
