import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { withSwal } from "react-sweetalert2";

function LocationsPage({ swal }) {
  const { data: session } = useSession();
  const canEdit = session?.user?.role === "admin";
  const [locations, setLocations] = useState([]);
  const [editedLocation, setEditedLocation] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    phone: "",
    email: "",
    description: "",
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  function fetchLocations() {
    axios.get("/api/locations").then((response) => {
      setLocations(response.data || []);
    });
  }

  function resetForm() {
    setEditedLocation(null);
    setFormError("");
    setForm({
      name: "",
      city: "",
      addressLine1: "",
      addressLine2: "",
      postalCode: "",
      phone: "",
      email: "",
      description: "",
      isActive: true,
      sortOrder: 0,
    });
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveLocation(ev) {
    ev.preventDefault();
    setFormError("");
    if (!form.name.trim()) {
      setFormError("Location name is required.");
      return;
    }

    try {
      setIsSaving(true);
      if (editedLocation?._id) {
        await axios.put("/api/locations", { ...form, _id: editedLocation._id });
      } else {
        await axios.post("/api/locations", form);
      }
      resetForm();
      fetchLocations();
    } catch (error) {
      setFormError(error?.response?.data?.error || error?.message || "Failed to save location.");
    } finally {
      setIsSaving(false);
    }
  }

  function editLocation(location) {
    setEditedLocation(location);
    setForm({
      name: location.name || "",
      city: location.city || "",
      addressLine1: location.addressLine1 || "",
      addressLine2: location.addressLine2 || "",
      postalCode: location.postalCode || "",
      phone: location.phone || "",
      email: location.email || "",
      description: location.description || "",
      isActive: typeof location.isActive === "boolean" ? location.isActive : true,
      sortOrder: location.sortOrder || 0,
    });
  }

  function deleteLocation(location) {
    swal
      .fire({
        title: "Delete location?",
        text: `Do you want to delete ${location.name}?`,
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#d55",
      })
      .then(async (result) => {
        if (!result.isConfirmed) return;
        await axios.delete(`/api/locations?id=${location._id}`);
        fetchLocations();
      });
  }

  return (
    <Layout>
      <div className={`grid gap-6 ${canEdit ? "xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]" : ""}`}>
        {canEdit && (
        <form onSubmit={saveLocation} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h1 className="mb-4 text-xl font-semibold">{editedLocation ? "Edit location" : "New location"}</h1>
          <div className="grid gap-3">
            <input placeholder="Location name" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
            <input placeholder="City" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
            <input placeholder="Address line 1" value={form.addressLine1} onChange={(e) => updateField("addressLine1", e.target.value)} />
            <input placeholder="Address line 2" value={form.addressLine2} onChange={(e) => updateField("addressLine2", e.target.value)} />
            <input placeholder="Postal code" value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} />
            <input placeholder="Phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
            <input placeholder="Email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
            <textarea placeholder="Description / notes" value={form.description} onChange={(e) => updateField("description", e.target.value)} />
            <input type="number" placeholder="Sort order" value={form.sortOrder} onChange={(e) => updateField("sortOrder", e.target.value)} />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => updateField("isActive", e.target.checked)} />
              Active
            </label>
          </div>
          {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </button>
            {editedLocation && (
              <button type="button" className="btn-default" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
        )}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Locations</h2>
          <div className="grid gap-3">
            {locations.map((location) => (
              <div key={location._id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-600">
                      {[location.city, location.addressLine1, location.postalCode].filter(Boolean).join(", ")}
                    </p>
                    {location.description && (
                      <p className="mt-2 text-sm text-gray-500">{location.description}</p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button type="button" className="btn-default" onClick={() => editLocation(location)}>
                        Edit
                      </button>
                      <button type="button" className="btn-red" onClick={() => deleteLocation(location)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {locations.length === 0 && <p className="text-sm text-gray-500">No locations yet.</p>}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withSwal(({ swal }) => <LocationsPage swal={swal} />);
