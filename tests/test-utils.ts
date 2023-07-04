/**
 * Check if two arrays intersect
 */
export const intersect = (
  a: Array<string | number>,
  b: Array<string | number>
) => {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  return Array.from(intersection);
};
