import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import axios from "axios";
import { withSwal } from "react-sweetalert2";
import { v4 as uuidv4 } from "uuid"; // import uuid for unique keys

function Categories({ swal }) {
  const [editedCategory, setEditedCategory] = useState(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [parentCategory, setParentCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [properties, setProperties] = useState([]);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  function fetchCategories() {
    axios.get("/api/categories").then((result) => {
      setCategories(result.data);
    });
  }

  async function saveCategory(ev) {
    ev.preventDefault();
    setFormError("");
    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    const data = {
      name: name.trim(),
      slug: slug.trim(),
      isActive,
      sortOrder: Number(sortOrder) || 0,
      parentCategory,
      properties: properties.map((p) => ({
        name: p.name,
        values: p.values
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      })),
    };
    try {
      setIsSaving(true);
      if (editedCategory) {
        data._id = editedCategory._id;
        await axios.put("/api/categories", data);
        setEditedCategory(null);
      } else {
        await axios.post("/api/categories", data);
      }
      setName("");
      setSlug("");
      setIsActive(true);
      setSortOrder(0);
      setParentCategory("");
      setProperties([]);
      fetchCategories();
    } catch (error) {
      setFormError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to save category."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function editCategory(category) {
    setEditedCategory(category);
    setName(category.name);
    setSlug(category.slug || "");
    setIsActive(typeof category.isActive === "boolean" ? category.isActive : true);
    setSortOrder(category.sortOrder || 0);
    setParentCategory(category.parent?._id);
    setProperties(
      (category.properties || []).map(({ name, values }) => ({
        id: uuidv4(), // Add a unique ID
        name,
        values: (values || []).join(","),
      }))
    );
  }

  function deleteCategory(category) {
    swal
      .fire({
        title: "Are you sure?",
        text: `Do you want to delete ${category.name}?`,
        showCancelButton: true,
        cancelButtonText: "Cancel",
        confirmButtonText: "Yes, Delete!",
        confirmButtonColor: "#d55",
        reverseButtons: true,
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          const { _id } = category;
          try {
            await axios.delete("/api/categories?_id=" + _id);
            fetchCategories();
          } catch (error) {
            setFormError(
              error?.response?.data?.error ||
                error?.message ||
                "Failed to delete category."
            );
          }
        }
      });
  }

  async function moveCategory(index, direction) {
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= categories.length) return;
    const current = categories[index];
    const other = categories[swapWith];
    try {
      await Promise.all([
        axios.put("/api/categories", {
          _id: current._id,
          name: current.name,
          slug: current.slug || current.name,
          parentCategory: current.parent?._id || "",
          properties: current.properties || [],
          isActive: current.isActive,
          sortOrder: other.sortOrder ?? swapWith,
        }),
        axios.put("/api/categories", {
          _id: other._id,
          name: other.name,
          slug: other.slug || other.name,
          parentCategory: other.parent?._id || "",
          properties: other.properties || [],
          isActive: other.isActive,
          sortOrder: current.sortOrder ?? index,
        }),
      ]);
      fetchCategories();
    } catch (error) {
      setFormError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to reorder categories."
      );
    }
  }

  function addProperty() {
    setProperties((prev) => [...prev, { id: uuidv4(), name: "", values: "" }]);
  }

  function handlePropertyNameChange(index, property, newName) {
    setProperties((prev) => {
      const properties = [...prev];
      properties[index].name = newName;
      return properties;
    });
  }

  function handlePropertyValuesChange(index, property, newValues) {
    setProperties((prev) => {
      const properties = [...prev];
      properties[index].values = newValues;
      return properties;
    });
  }

  function removeProperty(indexToRemove) {
    setProperties((prev) =>
      [...prev].filter((_, pIndex) => pIndex !== indexToRemove)
    );
  }

  return (
    <Layout>
      <div className="new-category-form bg-gray-100 rounded-md shadow-sm p-4 mb-4">
        <label>
          {editedCategory
            ? `Edit category ${editedCategory.name}`
            : "Create new category"}
        </label>
        {formError && <p className="text-red-600 mb-2">{formError}</p>}
        <form onSubmit={saveCategory}>
          <div className="flex gap-1">
            <input
              type="text"
              placeholder={"Category name"}
              onChange={(ev) => setName(ev.target.value)}
              value={name}
              required
            />
            <input
              type="text"
              placeholder={"Category slug (optional)"}
              onChange={(ev) => setSlug(ev.target.value)}
              value={slug}
            />
            <select
              onChange={(ev) => setParentCategory(ev.target.value)}
              value={parentCategory}
            >
              <option value="">No parent category</option>
              {categories.length > 0 &&
                categories.map((category) => (
                  <option
                    key={category._id}
                    value={category._id}
                    disabled={editedCategory?._id === category._id}
                  >
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex gap-3 items-center mb-2">
            <label className="flex items-center gap-2 mb-0">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(ev) => setIsActive(ev.target.checked)}
              />
              Active
            </label>
            <div className="flex items-center gap-1">
              <span>Sort order</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(ev) => setSortOrder(ev.target.value)}
                className="mb-0 w-24"
              />
            </div>
          </div>
          <div className="mb-2">
            <label className="block">Properties</label>
            <button
              onClick={addProperty}
              type="button"
              className="btn-default text-sm mb-2"
            >
              Add new property
            </button>
            {properties.length > 0 &&
              properties.map((property, index) => (
                <div key={property.id} className="flex gap-1 mb-2">
                  <input
                    type="text"
                    value={property.name}
                    className="mb-0"
                    onChange={(ev) =>
                      handlePropertyNameChange(index, property, ev.target.value)
                    }
                    placeholder="property name (example: color)"
                  />
                  <input
                    type="text"
                    className="mb-0"
                    onChange={(ev) =>
                      handlePropertyValuesChange(
                        index,
                        property,
                        ev.target.value
                      )
                    }
                    value={property.values}
                    placeholder="values, comma separated"
                  />
                  <button
                    onClick={() => removeProperty(index)}
                    type="button"
                    className="btn-red"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
          <div className="flex gap-1">
            {editedCategory && (
              <button
                type="button"
                onClick={() => {
                  setEditedCategory(null);
                  setName("");
                  setSlug("");
                  setIsActive(true);
                  setSortOrder(0);
                  setParentCategory("");
                  setProperties([]);
                  setFormError("");
                }}
                className="btn-default"
              >
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary py-1" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
      {!editedCategory && (
        <table className="basic mt-4">
          <thead>
            <tr>
              <td>Category name</td>
              <td>Slug</td>
              <td>Status</td>
              <td>Order</td>
              <td>Parent category</td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 &&
              categories.map((category, index) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td>{category.slug || "-"}</td>
                  <td>{category.isActive ? "Active" : "Hidden"}</td>
                  <td>{category.sortOrder ?? index}</td>
                  <td>{category?.parent?.name}</td>
                  <td>
                    <button
                      onClick={() => moveCategory(index, "up")}
                      className="btn-default mr-1"
                      type="button"
                      disabled={index === 0}
                    >
                      Up
                    </button>
                    <button
                      onClick={() => moveCategory(index, "down")}
                      className="btn-default mr-1"
                      type="button"
                      disabled={index === categories.length - 1}
                    >
                      Down
                    </button>
                    <button
                      onClick={() => editCategory(category)}
                      className="btn-default mr-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(category)}
                      className="btn-red"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}

export default withSwal(({ swal }, ref) => <Categories swal={swal} />);
