// lib/utils/buildFilters.ts
export function buildFilters(params: URLSearchParams) {
  const filters: Record<string, any> = {};

  const fields = [
    "mainDepartment",
    "mainStorageName",
    "qrLocation",
    "storageType",
  ];

  fields.forEach((key) => {
    const value = params.get(key);
    if (value) filters[key] = value;
  });

  return filters;
}
