import Direction from './direction';
import calculateScaleX from './calculateScaleX';
import calculateTranslateX from './calculateTranslateX';

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

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(num, max));
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
    let scaleX;
    let translateX;

    const relativeScrollMod = relativeScroll % 1;
    const isDifferentTab = currentTab !== nextTab || previousTab !== currentTab;
    const isDirectionRight = direction === Direction.RIGHT;

    const currentTabScrollProgress = isDifferentTab
      ? isDirectionRight ? relativeScrollMod : 1 - (relativeScrollMod)
      : isDirectionRight ? 1 - (relativeScrollMod || 1) : relativeScrollMod;

    if (!isDifferentTab) {
      let wasNextTabIndex = isDirectionRight ? currentTabIndex - 1 : currentTabIndex + 1;

      nextTab = tabs[wasNextTabIndex];
    }

    translateX = calculateTranslateX({
      currentTabOffsetLeft: currentTab.offsetLeft, 
      nextTabOffsetLeft: nextTab.offsetLeft,
      currentTabScrollProgress
    });

    scaleX = calculateScaleX({
      nextTabWidth: nextTab.clientWidth, 
      currentTabWidth: currentTab.clientWidth,
      currentTabScrollProgress
    });

    return { scaleX, translateX };
}