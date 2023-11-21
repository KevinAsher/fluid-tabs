import Direction from "./direction";

interface CalculateTransformProps {
  currentTab: HTMLElement;
  nextTab: HTMLElement;
  direction: Direction;
  relativeScroll: number;
}

interface TabIndicatorCssTransform {
  scaleX: number;
  translateX: number;
}

function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

export default function calculateTransform({
  currentTab,
  nextTab,
  direction,
  relativeScroll,
}: CalculateTransformProps): TabIndicatorCssTransform {
  const isDirectionRight = direction === Direction.RIGHT;
  const relativeScrollMod = relativeScroll % 1;
  const currentTabScrollProgress = isDirectionRight
    ? relativeScrollMod
    : 1 - relativeScrollMod;

  const translateX = lerp(
    currentTab.offsetLeft,
    nextTab.offsetLeft,
    currentTabScrollProgress,
  );
  const scaleX = lerp(
    1,
    nextTab.clientWidth / currentTab.clientWidth,
    currentTabScrollProgress,
  );

  return { scaleX, translateX };
}
