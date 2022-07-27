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
    let currentTabScrollProgress;
    let scaleX;
    let translateX;

    if (currentTab !== nextTab || previousTab !== currentTab) {
      // Swiping to a diferent tab
      currentTabScrollProgress = direction === Direction.RIGHT ? relativeScroll % 1 : 1 - (relativeScroll % 1);
    } else {
      // Swiping to the current tab
      currentTabScrollProgress = direction === Direction.RIGHT ? 1 - (relativeScroll % 1 || 1) : relativeScroll % 1;

      let wasNextTabIndex = direction === Direction.LEFT ? currentTabIndex + 1 : currentTabIndex - 1;

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