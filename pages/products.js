import Layout from "@/components/Layout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

export default function Products() {
  const { data: session } = useSession();
  const canEdit = session?.user?.role === "admin";
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setIsLoading(true);
    axios
      .get("/api/products")
      .then((response) => {
        setProducts(Array.isArray(response.data) ? response.data : []);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <Layout>
      {canEdit && (
        <div className="mb-4 flex justify-stretch sm:justify-end">
          <Link className="btn-primary flex items-center" href={"/products/new"}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              className="bi bi-plus"
              viewBox="0 0 16 16"
            >
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
            </svg>
            Add new product
          </Link>
        </div>
      )}
      <div className="grid gap-3 md:hidden">
        {isLoading &&
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`mobile-skeleton-${index}`}
              className="animate-pulse rounded-md border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="mb-3 h-5 w-3/4 rounded bg-gray-200" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 rounded bg-gray-200" />
                <div className="h-10 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        {products.map((product) => (
          <div key={product._id} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-800">{product.title}</h2>
            {canEdit && (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  className="btn-default justify-center"
                  href={"/products/edit/" + product._id}
                >
                  Edit
                </Link>
                <Link
                  className="btn-red justify-center"
                  href={"/products/delete/" + product._id}
                >
                  Delete
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <table className="basic mt-2">
          <thead>
            <tr>
              <td>Product name</td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={`desktop-skeleton-${index}`}>
                  <td>
                    <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <div className="h-9 w-20 animate-pulse rounded bg-gray-200" />
                      <div className="h-9 w-24 animate-pulse rounded bg-gray-200" />
                    </div>
                  </td>
                </tr>
              ))}
            {products.map((product) => (
              <tr key={product._id}>
                <td>{product.title}</td>
                <td>
                  {canEdit && (
                  <>
                  <Link
                    className="btn-default"
                    href={"/products/edit/" + product._id}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                    Edit
                  </Link>
                  <Link
                    className="btn-red"
                    href={"/products/delete/" + product._id}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                    Delete
                  </Link>
                  </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
