export default function getKeyByValue(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: Map<any, number>,
  searchValue: string | number,
) {
  for (const [key, value] of map.entries()) {
    if (value === searchValue) return key;
  }
}
