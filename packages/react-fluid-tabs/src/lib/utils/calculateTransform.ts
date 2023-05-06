import Direction from './direction';

interface CalculateTransformProps {
  currentTab: HTMLElement
  previousTab: HTMLElement | null
  nextTab: HTMLElement
  direction: Direction
  relativeScroll: number
  currentTabIndex: number
  tabs: HTMLElement[]
}

interface TabIndicatorCssTransform {
  scaleX: number
  translateX: number
}

function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

function calculateScrollProgress(relativeScroll: number, isDirectionRight: number, isDifferentTab: number) {
  if (isDifferentTab ^ isDirectionRight) {
    return 1 - (relativeScroll || isDirectionRight);
  }

  return relativeScroll;
}

function getNextTabIndex(currentTabIndex: number, isDirectionRight: boolean) {
  return isDirectionRight ? currentTabIndex - 1 : currentTabIndex + 1;
}

export default function calculateTransform({
  currentTab,
  previousTab,
  nextTab,
  direction,
  relativeScroll,
  currentTabIndex,
  tabs
}: CalculateTransformProps): TabIndicatorCssTransform {
  const relativeScrollMod = relativeScroll % 1;
  const isDifferentTab = currentTab !== nextTab || previousTab !== currentTab;
  const isDirectionRight = direction === Direction.RIGHT;

  const currentTabScrollProgress = calculateScrollProgress(relativeScrollMod, +isDirectionRight, +isDifferentTab);

  if (!isDifferentTab) {
    const wasNextTabIndex = getNextTabIndex(currentTabIndex, isDirectionRight);
    nextTab = tabs[wasNextTabIndex];
  }

  const translateX = lerp(currentTab.offsetLeft, nextTab.offsetLeft, currentTabScrollProgress);
  const scaleX = lerp(1, nextTab.clientWidth / currentTab.clientWidth, currentTabScrollProgress);

  return { scaleX, translateX };
}