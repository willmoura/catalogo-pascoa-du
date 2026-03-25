import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function AdminOrders() {
  const { data: orders, isLoading } = trpc.orders.list.useQuery();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Pedidos</h1>
          <p className="text-muted-foreground mt-2">
            Visualize os pedidos recebidos. Esta área está protegida e inacessível publicamente.
          </p>
        </div>
        
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Método</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Carregando pedidos do banco de dados...
                  </TableCell>
                </TableRow>
              ) : orders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                orders?.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber || `#${order.id}`}</TableCell>
                    <TableCell>
                      {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.customerName || "Não informado"}</div>
                      <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                    </TableCell>
                    <TableCell>
                      {order.totalAmount 
                        ? `R$ ${Number(order.totalAmount).toFixed(2).replace('.', ',')}` 
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{order.paymentMethod || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{order.deliveryMethod || "-"}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
