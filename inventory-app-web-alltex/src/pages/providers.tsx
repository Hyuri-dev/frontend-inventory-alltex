import React, { useEffect, useState, useCallback } from "react";
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
  Truck,
} from "lucide-react";

interface Zone {
  id: number;
  name: string;
}

interface Provider {
  id: number;
  name: string;
  address: string;
  phone: string;
  rif: string;
  id_zone: number;
  zone?: Zone;
}

const initialFormState = {
  name: "",
  address: "",
  phone: "",
  rif: "",
  id_zone: "",
};

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [selectedProviderName, setSelectedProviderName] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const triggerAlert = useCallback((type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [providersRes, zonesRes] = await Promise.all([
        api.get("/providers/all"),
        api.get("/zones/all"),
      ]);
      setProviders(providersRes.data);
      setZones(zonesRes.data);
    } catch (error) {
      console.error(error);
      triggerAlert("error", "Error al conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  }, [triggerAlert]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/providers/all"),
      api.get("/zones/all"),
    ])
      .then(([providersRes, zonesRes]) => {
        if (active) {
          setProviders(providersRes.data);
          setZones(zonesRes.data);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const parseFormPayload = () => {
    return {
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      rif: formData.rif.trim().toUpperCase(),
      id_zone: parseInt(formData.id_zone, 10),
    };
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = parseFormPayload();
      if (!payload.name || !payload.rif || isNaN(payload.id_zone)) {
        triggerAlert("error", "Por favor completa todos los campos requeridos.");
        setActionLoading(false);
        return;
      }
      await api.post("/providers/create", payload);
      triggerAlert("success", "Proveedor creado exitosamente.");
      setIsCreateOpen(false);
      setFormData(initialFormState);
      loadData();
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      const errMsg = err.response?.data?.message || "Error al crear el proveedor.";
      triggerAlert("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (provider: Provider) => {
    setSelectedProviderId(provider.id);
    setFormData({
      name: provider.name,
      address: provider.address,
      phone: provider.phone,
      rif: provider.rif,
      id_zone: provider.id_zone.toString(),
    });
    setIsEditOpen(true);
  };

  const handleUpdateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId) return;
    setActionLoading(true);
    try {
      const payload = parseFormPayload();
      await api.put(`/providers/update/id/${selectedProviderId}`, payload);
      triggerAlert("success", "Proveedor actualizado exitosamente.");
      setIsEditOpen(false);
      setFormData(initialFormState);
      loadData();
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      const errMsg = err.response?.data?.message || "Error al actualizar el proveedor.";
      triggerAlert("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (provider: Provider) => {
    setSelectedProviderId(provider.id);
    setSelectedProviderName(provider.name);
    setIsDeleteOpen(true);
  };

  const handleDeleteProvider = async () => {
    if (!selectedProviderId) return;
    setActionLoading(true);
    try {
      await api.delete(`/providers/delete/id/${selectedProviderId}`);
      triggerAlert("success", "Proveedor eliminado exitosamente.");
      setIsDeleteOpen(true); // Wait, this closes it, but let's change to false
      setIsDeleteOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      triggerAlert("error", "Error al eliminar el proveedor. Es posible que esté asociado a productos.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProviders = providers.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.rif.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Proveedores</h1>
          <p className="text-sm text-muted-foreground text-balance">
            Administra la información de contacto, RIF y zonas de los proveedores.
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData(initialFormState);
            setIsCreateOpen(true);
          }}
          className="w-fit bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-primary/20"
        >
          <Plus className="size-4" />
          Nuevo Proveedor
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
              placeholder="Buscar por nombre o RIF..."
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
            <p className="text-xs text-muted-foreground">Cargando proveedores...</p>
          </div>
        ) : filteredProviders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 font-semibold">Proveedor / RIF</th>
                  <th className="p-4 font-semibold">Teléfono</th>
                  <th className="p-4 font-semibold">Dirección</th>
                  <th className="p-4 font-semibold">Zona</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredProviders.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors duration-150">
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{p.rif}</div>
                    </td>
                    <td className="p-4 text-muted-foreground font-medium">{p.phone || "-"}</td>
                    <td className="p-4 text-muted-foreground truncate max-w-xs">{p.address || "-"}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {p.zone?.name || "Sin Zona"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150"
                          title="Editar"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(p)}
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
            <Truck className="size-10 text-muted-foreground/35 mb-2" />
            <p className="text-sm font-semibold text-foreground">No se encontraron proveedores</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Agrega un nuevo proveedor para comenzar a asignarlo a tus productos.
            </p>
          </div>
        )}
      </Card>

      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Crear Proveedor">
        <form onSubmit={handleCreateProvider} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nombre *</label>
              <Input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
                placeholder="Ej: Distribuidora Norte C.A."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">RIF *</label>
              <Input
                type="text"
                name="rif"
                required
                value={formData.rif}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
                placeholder="Ej: J-12345678-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Teléfono</label>
              <Input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
                placeholder="Ej: +58 212 555-5555"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Zona *</label>
              <Select
                name="id_zone"
                required
                value={formData.id_zone}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              >
                <option value="">Selecciona Zona</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Dirección</label>
            <Input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="bg-transparent text-foreground"
              placeholder="Ej: Av. Francisco de Miranda, Edif. Centro, Piso 2..."
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
              Guardar Proveedor
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Proveedor">
        <form onSubmit={handleUpdateProvider} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nombre *</label>
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
              <label className="text-xs font-semibold text-muted-foreground">RIF *</label>
              <Input
                type="text"
                name="rif"
                required
                value={formData.rif}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Teléfono</label>
              <Input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Zona *</label>
              <Select
                name="id_zone"
                required
                value={formData.id_zone}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              >
                <option value="">Selecciona Zona</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Dirección</label>
            <Input
              type="text"
              name="address"
              value={formData.address}
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

      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Eliminar Proveedor">
        <div className="space-y-4 pt-1">
          <p className="text-sm text-foreground">
            ¿Estás seguro de que deseas eliminar al proveedor{" "}
            <span className="font-bold text-red-500">"{selectedProviderName}"</span>? Esta acción no se puede deshacer.
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
              onClick={handleDeleteProvider}
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
