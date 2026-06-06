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
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Package,
} from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface Provider {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  code: string;
  weight: number;
  id_category: number;
  id_provider: number;
  current_stock: number | null;
  stock_minimum: number;
  price_buy: number;
  price_sell: number;
  category?: Category;
  provider?: Provider;
}

const initialFormState = {
  name: "",
  code: "",
  weight: "",
  id_category: "",
  id_provider: "",
  current_stock: "",
  stock_minimum: "",
  price_buy: "",
  price_sell: "",
};

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Estados de filtros y busquedas
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockAlertFilter, setStockAlertFilter] = useState(false);

  // Estados de los modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Estados de los formularios
  const [formData, setFormData] = useState(initialFormState);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedProductName, setSelectedProductName] = useState("");

  // Alertas
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, providersRes] = await Promise.all([
        api.get("/products/all"),
        api.get("/categories/all"),
        api.get("/providers/all"),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setProviders(providersRes.data);
    } catch (error) {
      console.error("Error loading inventory data:", error);
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

  // Manejador de cambio de entrada
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const parseFormPayload = () => {
    return {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      weight: parseInt(formData.weight, 10),
      id_category: parseInt(formData.id_category, 10),
      id_provider: parseInt(formData.id_provider, 10),
      current_stock: formData.current_stock
        ? parseInt(formData.current_stock, 10)
        : 0,
      stock_minimum: parseInt(formData.stock_minimum, 10),
      price_buy: parseFloat(formData.price_buy),
      price_sell: parseFloat(formData.price_sell),
    };
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = parseFormPayload();

      // Validaciones simples de la interfaz de usuario y tipos de datos
      if (
        !payload.name ||
        !payload.code ||
        isNaN(payload.weight) ||
        isNaN(payload.id_category) ||
        isNaN(payload.id_provider) ||
        isNaN(payload.current_stock) ||
        isNaN(payload.stock_minimum) ||
        isNaN(payload.price_buy) ||
        isNaN(payload.price_sell)
      ) {
        triggerAlert(
          "error",
          "Por favor completa todos los campos con valores correctos.",
        );
        setActionLoading(false);
        return;
      }

      if (payload.weight <= 0) {
        triggerAlert("error", "El peso debe ser mayor a 0.");
        setActionLoading(false);
        return;
      }

      if (payload.current_stock <= 0) {
        triggerAlert("error", "El stock actual debe ser mayor a 0.");
        setActionLoading(false);
        return;
      }

      if (payload.stock_minimum <= 0) {
        triggerAlert("error", "El stock mínimo debe ser mayor a 0.");
        setActionLoading(false);
        return;
      }

      if (payload.price_buy <= 0) {
        triggerAlert("error", "El precio de compra debe ser mayor a 0.");
        setActionLoading(false);
        return;
      }

      if (payload.price_sell <= 0) {
        triggerAlert("error", "El precio de venta debe ser mayor a 0.");
        setActionLoading(false);
        return;
      }

      if (payload.price_buy > payload.price_sell) {
        triggerAlert(
          "error",
          "El precio de compra no puede ser mayor al precio de venta.",
        );
        setActionLoading(false);
        return;
      }

      await api.post("/products/create", payload);
      triggerAlert("success", "Producto creado exitosamente.");
      setIsCreateOpen(false);
      setFormData(initialFormState);
      loadData();
    } catch (error: any) {
      console.error("Error creating product:", error);
      const errMsg =
        error.response?.data?.message || "Error al crear el producto.";
      triggerAlert("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setSelectedProductId(product.id);
    setFormData({
      name: product.name,
      code: product.code,
      weight: product.weight.toString(),
      id_category: product.id_category.toString(),
      id_provider: product.id_provider.toString(),
      current_stock: (product.current_stock ?? 0).toString(),
      stock_minimum: product.stock_minimum.toString(),
      price_buy: product.price_buy.toString(),
      price_sell: product.price_sell.toString(),
    });
    setIsEditOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setActionLoading(true);
    try {
      const payload = parseFormPayload();

      if (
        !payload.name ||
        !payload.code ||
        isNaN(payload.weight) ||
        isNaN(payload.id_category) ||
        isNaN(payload.id_provider) ||
        isNaN(payload.current_stock) ||
        isNaN(payload.stock_minimum) ||
        isNaN(payload.price_buy) ||
        isNaN(payload.price_sell)
      ) {
        triggerAlert(
          "error",
          "Por favor completa todos los campos con valores correctos.",
        );
        setActionLoading(false);
        return;
      }

      if (payload.weight <= 0) {
        triggerAlert("error", "El peso debe ser mayor a 0.");
        setActionLoading(false);
        return;
      }

      if (payload.current_stock <= 0) {
        triggerAlert("error", "El stock actual debe ser mayor a 0.");
        setActionLoading(false);
        return;
      }

      if (payload.stock_minimum <= 0) {
        triggerAlert("error", "El stock mínimo debe ser mayor a 0.");
        setActionLoading(false);
        return;
      }

      if (payload.price_buy <= 0) {
        triggerAlert("error", "El precio de compra debe ser mayor a 0.");
        setActionLoading(false);
        return;
      }

      if (payload.price_sell <= 0) {
        triggerAlert("error", "El precio de venta debe ser mayor a 0.");
        setActionLoading(false);
        return;
      }

      if (payload.price_buy > payload.price_sell) {
        triggerAlert(
          "error",
          "El precio de compra no puede ser mayor al precio de venta.",
        );
        setActionLoading(false);
        return;
      }
      await api.put(`/products/update/id/${selectedProductId}`, payload);
      triggerAlert("success", "Producto actualizado exitosamente.");
      setIsEditOpen(false);
      setFormData(initialFormState);
      loadData();
    } catch (error: any) {
      console.error("Error updating product:", error);
      const errMsg =
        error.response?.data?.message || "Error al actualizar el producto.";
      triggerAlert("error", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProductId(product.id);
    setSelectedProductName(product.name);
    setIsDeleteOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!selectedProductId) return;
    setActionLoading(true);
    try {
      await api.delete(`/products/delete/id/${selectedProductId}`);
      triggerAlert("success", "Producto eliminado exitosamente.");
      setIsDeleteOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      triggerAlert("error", "Error al eliminar el producto.");
    } finally {
      setActionLoading(false);
    }
  };

  // Lógica de filtrado
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "" || p.id_category === parseInt(categoryFilter, 10);

    const isLowStock = (p.current_stock ?? 0) <= p.stock_minimum;
    const matchesStockAlert = !stockAlertFilter || isLowStock;

    return matchesSearch && matchesCategory && matchesStockAlert;
  });

  return (
    <div className="space-y-6">
      {/* Información de la Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Inventario de Productos
          </h1>
          <p className="text-sm text-muted-foreground text-balance">
            Administra las existencias, precios, códigos, categorías y
            proveedores.
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
          Nuevo Producto
        </Button>
      </div>

      {/* ALERTAS*/}
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

      {/* FILTROS*/}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          {/* Entrada de Búsqueda */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="size-4" />
            </div>
            <Input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full bg-transparent focus-visible:ring-primary"
            />
          </div>

          {/* Filtro de Categoría */}
          <div className="w-full md:w-56">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-transparent focus-visible:ring-primary"
            >
              <option value="">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Botón de Alternancia de Alerta de Stock */}
          <button
            onClick={() => setStockAlertFilter(!stockAlertFilter)}
            className={`w-full md:w-auto px-4 py-2.5 rounded-lg border text-xs font-semibold tracking-wide uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${stockAlertFilter
              ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            <AlertTriangle className="size-3.5" />
            Alerta Stock Mínimo
          </button>
        </CardContent>
      </Card>

      {/* TABLA DE PRODUCTOS */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-7 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">
              Cargando catálogo...
            </p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 font-semibold">Código / Nombre</th>
                  <th className="p-4 font-semibold">Categoría</th>
                  <th className="p-4 font-semibold">Stock</th>
                  <th className="p-4 font-semibold">
                    Precios (Compra / Venta)
                  </th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredProducts.map((p) => {
                  const stock = p.current_stock ?? 0;
                  const isCritical = stock <= p.stock_minimum;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-muted/30 transition-colors duration-150"
                    >
                      {/* NOMBRE Y CODIGO */}
                      <td className="p-4">
                        <div className="font-semibold text-foreground">
                          {p.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {p.code}
                        </div>
                      </td>

                      {/* CATEGORIA*/}
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          {p.category?.name || "Sin Categoría"}
                        </span>
                      </td>

                      {/* NIVEL DE STOCK*/}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${isCritical ? "text-amber-500" : "text-foreground"}`}
                          >
                            {stock}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / Min {p.stock_minimum}
                          </span>
                          {isCritical && (
                            <span
                              className="size-1.5 rounded-full bg-amber-500"
                              title="Alerta Stock Mínimo"
                            />
                          )}
                        </div>
                      </td>

                      {/* PRECIOS */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground font-medium">
                            C: ${p.price_buy.toFixed(2)}
                          </span>
                          <span className="text-border">|</span>
                          <span className="font-semibold text-primary">
                            V: ${p.price_sell.toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Editar / Eliminar */}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8">
            <Package className="size-10 text-muted-foreground/35 mb-2" />
            <p className="text-sm font-semibold text-foreground">
              No se encontraron productos
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Prueba cambiando los filtros de búsqueda o agrega un nuevo
              producto al catálogo.
            </p>
          </div>
        )}
      </Card>

      {/* CREAR MODAL*/}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Crear Nuevo Producto"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Nombre
              </label>
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
              <label className="text-xs font-semibold text-muted-foreground">
                Código de Referencia
              </label>
              <Input
                type="text"
                name="code"
                required
                placeholder="PROD-001"
                value={formData.code}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Categoría
              </label>
              <Select
                name="id_category"
                required
                value={formData.id_category}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              >
                <option value="">Selecciona Categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Proveedor
              </label>
              <Select
                name="id_provider"
                required
                value={formData.id_provider}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              >
                <option value="">Selecciona Proveedor</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Peso (g)
              </label>
              <Input
                type="number"
                name="weight"
                required
                min="1"
                value={formData.weight}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Stock Actual
              </label>
              <Input
                type="number"
                name="current_stock"
                min="1"
                value={formData.current_stock}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Stock Mínimo
              </label>
              <Input
                type="number"
                name="stock_minimum"
                required
                min="1"
                value={formData.stock_minimum}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Precio Compra ($)
              </label>
              <Input
                type="number"
                step="0.01"
                name="price_buy"
                required
                min="0.01"
                value={formData.price_buy}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Precio Venta ($)
              </label>
              <Input
                type="number"
                step="0.01"
                name="price_sell"
                required
                min="0.01"
                value={formData.price_sell}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
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
              Guardar Producto
            </Button>
          </div>
        </form>
      </Dialog>

      {/* EDITAR MODAL */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Editar Producto"
      >
        <form onSubmit={handleUpdateProduct} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Nombre
              </label>
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
              <label className="text-xs font-semibold text-muted-foreground">
                Código de Referencia
              </label>
              <Input
                type="text"
                name="code"
                required
                value={formData.code}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Categoría
              </label>
              <Select
                name="id_category"
                required
                value={formData.id_category}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              >
                <option value="">Selecciona Categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Proveedor
              </label>
              <Select
                name="id_provider"
                required
                value={formData.id_provider}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              >
                <option value="">Selecciona Proveedor</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Peso (g)
              </label>
              <Input
                type="number"
                name="weight"
                required
                min="1"
                value={formData.weight}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Stock Actual
              </label>
              <Input
                type="number"
                name="current_stock"
                min="1"
                value={formData.current_stock}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Stock Mínimo
              </label>
              <Input
                type="number"
                name="stock_minimum"
                required
                min="1"
                value={formData.stock_minimum}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Precio Compra ($)
              </label>
              <Input
                type="number"
                step="0.01"
                name="price_buy"
                required
                min="0.01"
                value={formData.price_buy}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Precio Venta ($)
              </label>
              <Input
                type="number"
                step="0.01"
                name="price_sell"
                required
                min="0.01"
                value={formData.price_sell}
                onChange={handleInputChange}
                className="bg-transparent text-foreground"
              />
            </div>
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
              Actualizar Producto
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL DE VERIFICACION*/}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Eliminar Producto"
      >
        <div className="space-y-4 pt-1">
          <p className="text-sm text-foreground">
            ¿Estás seguro de que deseas eliminar el producto{" "}
            <span className="font-bold text-red-500">
              "{selectedProductName}"
            </span>
            ? Esta acción es irreversible y lo borrará permanentemente de la
            base de datos.
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
              onClick={handleDeleteProduct}
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
