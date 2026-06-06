import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "@/api/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, Layers, Users, RefreshCw, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: number;
  name: string;
  code: string;
  current_stock: number | null;
  stock_minimum: number;
  price_sell: number;
  category?: { name: string };
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalCategories: 0,
    totalProviders: 0,
    totalValue: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [categoryChartData, setCategoryChartData] = useState<{ name: string; count: number }[]>([]);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, categoriesRes, providersRes] = await Promise.all([
        api.get("/products/all"),
        api.get("/categories/all"),
        api.get("/providers/all"),
      ]);

      const products = productsRes.data as Product[];
      const categories = categoriesRes.data;
      const providers = providersRes.data;

      // Calculo de productos con stock bajo
      const lowStock = products.filter((p) => {
        const current = p.current_stock ?? 0;
        return current <= p.stock_minimum;
      });

      const totalVal = products.reduce((acc, p) => {
        return acc + (p.price_sell * (p.current_stock ?? 0));
      }, 0);

      setMetrics({
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        totalCategories: categories.length,
        totalProviders: providers.length,
        totalValue: totalVal,
      });

      setLowStockProducts(lowStock.slice(0, 5)); // mostrar los 5 productos con menor stock

      // Agrupar productos por categoría para el gráfico personalizado
      const categoryGroups: { [key: string]: number } = {};
      products.forEach((p) => {
        const catName = p.category?.name || "Sin Categoría";
        categoryGroups[catName] = (categoryGroups[catName] || 0) + 1;
      });

      const chartData = Object.entries(categoryGroups).map(([name, count]) => ({
        name,
        count,
      })).sort((a, b) => b.count - a.count).slice(0, 5); // las 5 categorías principales

      setCategoryChartData(chartData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Cargando datos del panel...</p>
      </div>
    );
  }

  // Calcular el conteo más alto para la escala del gráfico SVG
  const maxCategoryCount = Math.max(...categoryChartData.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Cabecera de Bienvenida */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resumen de Operación</h1>
          <p className="text-sm text-muted-foreground">Monitorea el estado general de tu inventario en tiempo real.</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="w-fit cursor-pointer"
        >
          <RefreshCw className={`size-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      {/* Cuadrícula de Tarjetas Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tarjeta de Total de Productos */}
        <Card className="hover:border-primary/40 transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Productos
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Package className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrados en la plataforma</p>
          </CardContent>
        </Card>

        {/* Tarjeta de Stock Bajo */}
        <Card className={`hover:border-destructive/40 transition-smooth ${metrics.lowStockCount > 0 ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/2.5" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Alertas de Stock
            </CardTitle>
            <div className={`p-2 rounded-lg ${metrics.lowStockCount > 0 ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"}`}>
              <AlertTriangle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.lowStockCount > 0 ? "text-amber-500" : ""}`}>
              {metrics.lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.lowStockCount > 0 ? "Productos en stock mínimo o inferior" : "Niveles de inventario óptimos"}
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta de Categorías */}
        <Card className="hover:border-primary/40 transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Categorías
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCategories}</div>
            <p className="text-xs text-muted-foreground mt-1">Líneas de producto activas</p>
          </CardContent>
        </Card>

        {/* Tarjeta de Proveedores */}
        <Card className="hover:border-primary/40 transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Proveedores
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProviders}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrados en el sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Cuadrícula de Gráficos Principales y Notificaciones */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Tarjeta de Gráfico SVG (5 columnas en mediano, 7 en base) */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Distribución por Categorías
            </CardTitle>
            <CardDescription>
              Representación de la cantidad de productos por línea de categoría
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-end pt-4">
            {categoryChartData.length > 0 ? (
              <div className="flex h-full items-end gap-4 md:gap-6 px-2">
                {categoryChartData.map((data, index) => {
                  const percentage = (data.count / maxCategoryCount) * 100;
                  return (
                    <div key={data.name} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Información sobre herramientas (Tooltip) */}
                      <div className="absolute top-0 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] py-1 px-2 rounded-md -translate-y-4 shadow-md font-semibold z-10 whitespace-nowrap">
                        {data.count} {data.count === 1 ? "producto" : "productos"}
                      </div>

                      {/* Barra */}
                      <div
                        style={{ height: `${Math.max(percentage, 8)}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 ease-out group-hover:opacity-85 ${index === 0
                            ? "bg-primary shadow-sm shadow-primary/20"
                            : index === 1
                              ? "bg-indigo-500/80"
                              : index === 2
                                ? "bg-violet-500/70"
                                : index === 3
                                  ? "bg-purple-500/60"
                                  : "bg-fuchsia-500/50"
                          }`}
                      />

                      {/* Etiqueta */}
                      <span className="text-[10px] text-muted-foreground font-semibold mt-2.5 truncate max-w-full text-center">
                        {data.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No hay categorías ni productos registrados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Alertas de Stock Bajo (3 columnas) */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Alertas Críticas</CardTitle>
              <CardDescription>Productos con existencias críticas</CardDescription>
            </div>
            {metrics.lowStockCount > 0 && (
              <span className="flex size-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-amber-500"></span>
              </span>
            )}
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-between">
            <div className="space-y-3.5 overflow-y-auto max-h-[12.5rem]">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((p) => {
                  const stock = p.current_stock ?? 0;
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors border border-border/30">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.code}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className={`text-xs font-bold ${stock === 0 ? "text-red-500" : "text-amber-500"}`}>
                          {stock} u
                        </p>
                        <p className="text-[9px] text-muted-foreground">Min: {p.stock_minimum}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                  <Package className="size-6 text-muted-foreground/45 mb-1.5" />
                  <p className="text-xs font-medium">¡Sin alertas críticas!</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Todos los productos cuentan con niveles de stock óptimos.</p>
                </div>
              )}
            </div>

            <Link to="/inventory" className="w-full mt-4">
              <Button variant="ghost" size="sm" className="w-full text-xs font-medium flex items-center justify-center gap-1 hover:text-primary">
                Ver inventario completo
                <ArrowRight className="size-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
