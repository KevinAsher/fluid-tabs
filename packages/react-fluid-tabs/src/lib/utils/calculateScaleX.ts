interface CalculateScaleXProps {
  nextTabWidth: number,
  currentTabWidth: number,
  currentTabScrollProgress: number,
}

export default function calculateScaleX({
  nextTabWidth, 
  currentTabWidth, 
  currentTabScrollProgress
}: CalculateScaleXProps): number {
  return 1 - currentTabScrollProgress * (1 - nextTabWidth / currentTabWidth);
}