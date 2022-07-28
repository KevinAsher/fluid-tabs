interface CalculateTranslateXProps {
  nextTabOffsetLeft: number,
  currentTabOffsetLeft: number,
  currentTabScrollProgress: number,
}

export default function calculateTranslateX({
  nextTabOffsetLeft, 
  currentTabOffsetLeft, 
  currentTabScrollProgress
}: CalculateTranslateXProps): number {
  return currentTabOffsetLeft + currentTabScrollProgress * (nextTabOffsetLeft - currentTabOffsetLeft);
}