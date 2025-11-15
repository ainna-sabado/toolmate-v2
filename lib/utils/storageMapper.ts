// lib/utils/storageMapper.ts
export function mapStorages(items: any[]) {
  const map = new Map();

  items.forEach((item) => {
    if (!item?.mainStorageName) return;

    map.set(item.mainStorageName, {
      mainStorageName: item.mainStorageName,
      mainStorageCode: item.mainStorageCode || "",
      storageType: item.storageType || "",
    });
  });

  return Array.from(map.values());
}
