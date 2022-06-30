export function getKeyByValue(map: Map<string, number>, searchValue: number) {
  for (let [key, value] of map.entries()) {
    if (value === searchValue)
      return key;
  }
}