import Layout from "@/components/Layout";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = useCallback(() => {
    setIsLoading(true);
    setError("");
    axios
      .get("/api/orders")
      .then((response) => {
        setOrders(response.data);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.error || err?.message || "Failed to load orders."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <Layout>
      <h1>Orders</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {isLoading && <p>Loading orders...</p>}
      <table className="basic">
        <thead>
          <tr>
            <th>Date</th>
            <th>Order status</th>
            <th>Payment status</th>
            <th>Recipient</th>
            <th>Products</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 &&
            orders.map((order) => (
              <tr key={order._id}>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
                <td className={order.orderStatus === "completed" ? "text-green-600" : ""}>
                  {order.orderStatus || "pending_payment"}
                </td>
                <td className={order.paymentStatus === "paid" ? "text-green-600" : ""}>
                  {order.paymentStatus || "unpaid"}
                </td>
                <td>
                  {order.customer?.name} {order.customer?.email}
                  <br />
                  {order.customer?.city} {order.customer?.postalCode} {order.customer?.country}
                  <br />
                  {order.customer?.streetAddress}
                </td>
                <td>
                  {(order.products || []).map((p, index) => (
                    <span key={`${order._id}-${index}`}>
                      {p.name} x{p.quantity}
                      <br />
                    </span>
                  ))}
                </td>
                <td>
                  {typeof order.totalAmount === "number"
                    ? `${order.totalAmount.toFixed(2)} PLN`
                    : "-"}
                </td>
              </tr>
            ))}
          {orders.length === 0 && !isLoading && (
            <tr>
              <td colSpan={6}>No orders found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </Layout>
  );
}
