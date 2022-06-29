
interface CalculateScaleXProps {
  nextTabWidth: number,
  currentTabWidth: number,
  currentTabScrollProgress: number,
}

function calculateScaleX({nextTabWidth, currentTabWidth, currentTabScrollProgress}: CalculateScaleXProps): number {
  let scaleX = 1;
  const tabWidthRatio = nextTabWidth / currentTabWidth;

  if (tabWidthRatio < 1) {
    scaleX = 1 - currentTabScrollProgress * (1 - tabWidthRatio);
  } else {
    scaleX = 1 + currentTabScrollProgress * (tabWidthRatio - 1);
  }

  return scaleX;
}

export enum Direction {
  LEFT = "LEFT",
  RIGHT = "RIGHT"
}

interface CalculateTransformProps {
  currentTab: HTMLElement
  previousTab: HTMLElement
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

// TODO: simplify convoluted function
export function calculateTransform({
  currentTab, 
  previousTab, 
  nextTab, 
  direction, 
  relativeScroll, 
  currentTabIndex, 
  tabs}: CalculateTransformProps
): TabIndicatorCssTransform {
    let currentTabScrollProgress;
    let scaleX;
    let translateX = 0;
    let nextTabWidth;
    let currentTabWidth = currentTab.clientWidth;
    let offsetLeft = currentTab.offsetLeft;

    if (currentTab !== nextTab || previousTab !== currentTab) {
      currentTabScrollProgress = direction === Direction.RIGHT ? relativeScroll % 1 : 1 - (relativeScroll % 1);

      nextTabWidth = nextTab.clientWidth;

      if (direction === Direction.RIGHT) {
        translateX = offsetLeft + (relativeScroll % 1) * currentTabWidth;
      } else {
        translateX = offsetLeft - (1 - (relativeScroll % 1 || 1)) * nextTabWidth;
      }
    } else {
      currentTabScrollProgress = direction === Direction.RIGHT ? 1 - (relativeScroll % 1 || 1) : relativeScroll % 1;

      let wasGonnaBeNextTabIndex;
      let wasGonnaBeNextTab;
      if (direction === Direction.LEFT) {
        wasGonnaBeNextTabIndex = clamp(currentTabIndex + 1, 0, tabs.length-1);
      } else {
        wasGonnaBeNextTabIndex = clamp(currentTabIndex - 1, 0, tabs.length-1);
      }

      wasGonnaBeNextTab = tabs[wasGonnaBeNextTabIndex];
      nextTabWidth = wasGonnaBeNextTab.clientWidth;

      if (direction === Direction.RIGHT) {
        translateX = offsetLeft - currentTabScrollProgress * nextTabWidth;
      } else {
        translateX = offsetLeft + currentTabScrollProgress * currentTabWidth;
      }
    }

    scaleX = calculateScaleX({nextTabWidth, currentTabWidth, currentTabScrollProgress});

    return { scaleX, translateX };
}