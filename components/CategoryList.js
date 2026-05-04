function CategoryList({
  isLoading,
  categories,
  editCategory,
  deleteCategory,
  moveCategory,
}) {
  return (
    <>
      <div className="mt-4 grid gap-3 md:hidden">
        {isLoading &&
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`mobile-category-skeleton-${index}`}
              className="animate-pulse rounded-md border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
              <div className="mb-2 h-4 w-1/2 rounded bg-gray-200" />
              <div className="mb-2 h-4 w-2/5 rounded bg-gray-200" />
              <div className="mb-2 h-4 w-1/3 rounded bg-gray-200" />
              <div className="mb-3 h-4 w-3/5 rounded bg-gray-200" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 rounded bg-gray-200" />
                <div className="h-10 rounded bg-gray-200" />
                <div className="h-10 rounded bg-gray-200" />
                <div className="h-10 rounded bg-gray-200" />
              </div>
            </div>
          ))}
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
            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={`desktop-category-skeleton-${index}`}>
                  <td>
                    <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td>
                    <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td>
                    <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td>
                    <div className="h-5 w-12 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td>
                    <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <div className="h-9 w-14 animate-pulse rounded bg-gray-200" />
                      <div className="h-9 w-16 animate-pulse rounded bg-gray-200" />
                      <div className="h-9 w-16 animate-pulse rounded bg-gray-200" />
                      <div className="h-9 w-20 animate-pulse rounded bg-gray-200" />
                    </div>
                  </td>
                </tr>
              ))}
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
