import Layout from "@/components/Layout";
import CategoryForm from "@/components/CategoryForm";
import CategoryList from "@/components/CategoryList";
import { useEffect, useState } from "react";
import axios from "axios";
import { withSwal } from "react-sweetalert2";
import { v4 as uuidv4 } from "uuid"; // import uuid for unique keys

function Categories({ swal }) {
  const [showForm, setShowForm] = useState(false);
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  function fetchCategories() {
    setIsLoading(true);
    axios
      .get("/api/categories")
      .then((result) => {
        setCategories(Array.isArray(result.data) ? result.data : []);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function resetForm() {
    setShowForm(false);
    setEditedCategory(null);
    setName("");
    setSlug("");
    setIsActive(true);
    setSortOrder(0);
    setParentCategory("");
    setProperties([]);
    setFormError("");
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
      } else {
        await axios.post("/api/categories", data);
      }
      resetForm();
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
    setShowForm(true);
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

  function handlePropertyNameChange(index, newName) {
    setProperties((prev) => {
      const properties = [...prev];
      properties[index].name = newName;
      return properties;
    });
  }

  function handlePropertyValuesChange(index, newValues) {
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

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  return (
    <Layout>
      <div className="mb-4 flex justify-stretch sm:justify-end">
        <button
          type="button"
          className="btn-primary flex items-center justify-center"
          onClick={openCreateForm}
        >
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
          Add new category
        </button>
      </div>
      {(showForm || editedCategory) && (
        <CategoryForm
          editedCategory={editedCategory}
          formError={formError}
          name={name}
          setName={setName}
          slug={slug}
          setSlug={setSlug}
          isActive={isActive}
          setIsActive={setIsActive}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          parentCategory={parentCategory}
          setParentCategory={setParentCategory}
          categories={categories}
          properties={properties}
          addProperty={addProperty}
          handlePropertyNameChange={handlePropertyNameChange}
          handlePropertyValuesChange={handlePropertyValuesChange}
          removeProperty={removeProperty}
          saveCategory={saveCategory}
          resetForm={resetForm}
          isSaving={isSaving}
        />
      )}
      {!showForm && !editedCategory && (
        <CategoryList
          isLoading={isLoading}
          categories={categories}
          editCategory={editCategory}
          deleteCategory={deleteCategory}
          moveCategory={moveCategory}
        />
      )}
    </Layout>
  );
}

export default withSwal(({ swal }, ref) => <Categories swal={swal} />);
