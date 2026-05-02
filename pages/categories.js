import Layout from "@/components/Layout";
import CategoryForm from "@/components/CategoryForm";
import CategoryList from "@/components/CategoryList";
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

  function resetForm() {
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

  return (
    <Layout>
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
      {!editedCategory && (
        <CategoryList
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
