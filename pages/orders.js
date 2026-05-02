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
      <div className="grid gap-3 md:hidden">
        {orders.length > 0 &&
          orders.map((order) => (
            <article key={order._id} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    {order.customer?.name || "No recipient"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <strong className="text-sm text-gray-800">
                  {typeof order.totalAmount === "number"
                    ? `${order.totalAmount.toFixed(2)} PLN`
                    : "-"}
                </strong>
              </div>
              <p className={`text-sm ${order.orderStatus === "completed" ? "text-green-600" : "text-gray-600"}`}>
                Order: {order.orderStatus || "pending_payment"}
              </p>
              <p className={`text-sm ${order.paymentStatus === "paid" ? "text-green-600" : "text-gray-600"}`}>
                Payment: {order.paymentStatus || "unpaid"}
              </p>
              <p className="text-sm text-gray-600">
                Delivery: {order.deliveryMethod || "-"} ({typeof order.deliveryPrice === "number"
                  ? `${order.deliveryPrice.toFixed(2)} PLN`
                  : "-"})
              </p>
              <p className="text-sm text-gray-600">
                Method: {order.paymentMethod || "-"} / session: {order.paymentSessionStatus || "-"}
              </p>
              <div className="mt-2 text-sm text-gray-600">
                <p>{order.customer?.email}</p>
                <p>
                  {order.customer?.city} {order.customer?.postalCode} {order.customer?.country}
                </p>
                <p>{order.customer?.streetAddress}</p>
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-700">
                {(order.products || []).map((p, index) => (
                  <p key={`${order._id}-${index}`}>
                    {p.name} x{p.quantity}
                  </p>
                ))}
              </div>
            </article>
          ))}
        {orders.length === 0 && !isLoading && (
          <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm">
            No orders found.
          </div>
        )}
      </div>
      <div className="hidden md:block">
        <table className="basic">
          <thead>
            <tr>
              <th>Date</th>
              <th>Order status</th>
              <th>Payment status</th>
              <th>Recipient</th>
              <th>Delivery</th>
              <th>Payment method</th>
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
                    {order.deliveryMethod || "-"}
                    <br />
                    {typeof order.deliveryPrice === "number"
                      ? `${order.deliveryPrice.toFixed(2)} PLN`
                      : "-"}
                    <br />
                    {order.deliveryEtaLabel || "-"}
                  </td>
                  <td>
                    {order.paymentMethod || "-"}
                    <br />
                    {order.paymentSessionStatus || "-"}
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
                    {typeof order.grandTotal === "number"
                      ? `${order.grandTotal.toFixed(2)} PLN`
                      : typeof order.totalAmount === "number"
                        ? `${order.totalAmount.toFixed(2)} PLN`
                      : "-"}
                  </td>
                </tr>
              ))}
            {orders.length === 0 && !isLoading && (
              <tr>
                <td colSpan={8}>No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
