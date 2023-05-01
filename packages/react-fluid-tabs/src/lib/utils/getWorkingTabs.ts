import Direction from './direction' ;

interface GetWorkingTabsProps {
  previousTab: HTMLElement
  direction: Direction
  relativeScroll: number
  previousRelativeScroll: number
  tabs: HTMLElement[]
}

interface WorkingTabs {
  currentTab: HTMLElement
  nextTab: HTMLElement
}

export default function getWorkingTabs({
  previousTab, 
  tabs, 
  direction, 
  relativeScroll, 
  previousRelativeScroll
}: GetWorkingTabsProps): WorkingTabs {
  let currentTab = previousTab;

  let scrollTabIndex = Math.trunc(relativeScroll);
  let previousScrollTabIndex = Math.trunc(previousRelativeScroll);

  if (direction === Direction.RIGHT && scrollTabIndex > previousScrollTabIndex) {
    currentTab = tabs[scrollTabIndex];
  } else if (direction === Direction.LEFT && (scrollTabIndex < previousScrollTabIndex || relativeScroll % 1 === 0)) {
    currentTab = tabs[previousScrollTabIndex];
  }

  let nextTab = tabs[direction === Direction.RIGHT ? Math.ceil(relativeScroll) : Math.floor(relativeScroll)];
  return { currentTab, nextTab }
}
