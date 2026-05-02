function CategoryList({
  categories,
  editCategory,
  deleteCategory,
  moveCategory,
}) {
  return (
    <>
      <div className="mt-4 grid gap-3 md:hidden">
        {categories.length > 0 &&
          categories.map((category, index) => (
            <div
              key={category._id}
              className="rounded-md border border-gray-200 bg-white p-3 shadow-sm"
            >
              <h3 className="mb-1 text-base font-semibold text-gray-800">
                {category.name}
              </h3>
              <p className="text-sm text-gray-500">Slug: {category.slug || "-"}</p>
              <p className="text-sm text-gray-500">
                Status: {category.isActive ? "Active" : "Hidden"}
              </p>
              <p className="text-sm text-gray-500">
                Order: {category.sortOrder ?? index}
              </p>
              <p className="text-sm text-gray-500">
                Parent: {category?.parent?.name || "-"}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => moveCategory(index, "up")}
                  className="btn-default"
                  type="button"
                  disabled={index === 0}
                >
                  Up
                </button>
                <button
                  onClick={() => moveCategory(index, "down")}
                  className="btn-default"
                  type="button"
                  disabled={index === categories.length - 1}
                >
                  Down
                </button>
                <button
                  onClick={() => editCategory(category)}
                  className="btn-default"
                  type="button"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteCategory(category)}
                  className="btn-red"
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>
      <div className="hidden md:block">
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
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(category)}
                      className="btn-red"
                      type="button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default CategoryList;
