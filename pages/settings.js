import Layout from "@/components/Layout";

export default function Settings() {
  return (
    <Layout>
      <h2 className="mb-4">Settings</h2>
      <div className="max-w-2xl bg-white p-4 rounded-md shadow-sm">
        <p className="mb-2">
          Auction admin integration now uses a secure server-side proxy.
        </p>
        <p className="mb-2">
          Set these environment variables in admin app:
        </p>
        <pre className="bg-gray-100 p-3 rounded-md text-sm mb-2">
{`AUCTION_BACKEND_URL=http://localhost:4000
AUCTION_ADMIN_TOKEN=your_admin_bearer_token`}
        </pre>
        <p>
          After updating `.env`, restart the admin app server.
        </p>
      </div>
    </Layout>
  );
}
