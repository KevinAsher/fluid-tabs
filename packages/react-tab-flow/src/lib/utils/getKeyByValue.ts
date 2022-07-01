export default function getKeyByValue(map: Map<string | number, number>, searchValue: string | number) {
  for (let [key, value] of map.entries()) {
    if (value === searchValue)
      return key;
  }
}