export default function transformCss (translateX: number, scaleX: number) {
  return `translateX(${translateX}px) scaleX(${scaleX})`;
}