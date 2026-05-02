function CategoryForm({
  editedCategory,
  formError,
  name,
  setName,
  slug,
  setSlug,
  isActive,
  setIsActive,
  sortOrder,
  setSortOrder,
  parentCategory,
  setParentCategory,
  categories,
  properties,
  addProperty,
  handlePropertyNameChange,
  handlePropertyValuesChange,
  removeProperty,
  saveCategory,
  resetForm,
  isSaving,
}) {
  return (
    <div className="new-category-form bg-gray-100 rounded-md shadow-sm p-4 mb-4">
      <label>
        {editedCategory
          ? `Edit category ${editedCategory.name}`
          : "Create new category"}
      </label>
      {formError && <p className="text-red-600 mb-2">{formError}</p>}
      <form onSubmit={saveCategory}>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            type="text"
            placeholder="Category name"
            onChange={(ev) => setName(ev.target.value)}
            value={name}
            required
          />
          <input
            type="text"
            placeholder="Category slug (optional)"
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
        <div className="mb-2 flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex items-center gap-2 mb-0">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(ev) => setIsActive(ev.target.checked)}
            />
            Active
          </label>
          <div className="flex items-center gap-2">
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
              <div
                key={property.id}
                className="mb-2 grid gap-2 md:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  type="text"
                  value={property.name}
                  className="mb-0"
                  onChange={(ev) =>
                    handlePropertyNameChange(index, ev.target.value)
                  }
                  placeholder="property name (example: color)"
                />
                <input
                  type="text"
                  className="mb-0"
                  onChange={(ev) =>
                    handlePropertyValuesChange(index, ev.target.value)
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
        <div className="flex flex-col gap-2 sm:flex-row">
          {editedCategory && (
            <button
              type="button"
              onClick={resetForm}
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
  );
}

export default CategoryForm;
