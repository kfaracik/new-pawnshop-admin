type CategoryProperty = {
  name?: string;
  values?: string[];
};

type AdminCategory = {
  _id: string;
  name?: string;
  parent?: { _id?: string } | null;
  properties?: CategoryProperty[];
};

type ValidateProductInput = {
  title: string;
  price: string | number;
};

export function validateProductInput({ title, price }: ValidateProductInput) {
  if (!title.trim()) {
    return "Product name is required.";
  }

  if (price === "" || Number(price) <= 0 || Number.isNaN(Number(price))) {
    return "Price must be a number greater than 0.";
  }

  return "";
}

export function buildProductPayload({
  title,
  description,
  price,
  quantity,
  images,
  category,
  properties,
  availabilityMode,
  availableLocations,
}: {
  title: string;
  description: string;
  price: string | number;
  quantity: string | number;
  images: string[];
  category: string;
  properties: Record<string, string>;
  availabilityMode: string;
  availableLocations: string[];
}) {
  return {
    title: title.trim(),
    description,
    price,
    quantity,
    images,
    category,
    properties,
    availabilityMode,
    availableLocations,
  };
}

export function getPropertiesToFill(categories: AdminCategory[], categoryId: string) {
  const propertiesToFill: CategoryProperty[] = [];
  if (!categories.length || !categoryId) {
    return propertiesToFill;
  }

  let category = categories.find(({ _id }) => _id === categoryId);
  if (!category) {
    return propertiesToFill;
  }

  const visited = new Set<string>();
  while (category && !visited.has(category._id)) {
    visited.add(category._id);
    propertiesToFill.push(...(Array.isArray(category.properties) ? category.properties : []));

    const parentId: string | undefined = category.parent?._id;
    category = parentId ? categories.find(({ _id }) => _id === parentId) : undefined;
  }

  return propertiesToFill.filter(
    (property) => property && typeof property.name === "string" && property.name.length > 0
  );
}
