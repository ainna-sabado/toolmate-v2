export function sanitizeStrings(obj: any) {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "string") {
      const trimmed = obj[key].trim();
      obj[key] = trimmed === "" ? undefined : trimmed;
    }
  });
  return obj;
}
