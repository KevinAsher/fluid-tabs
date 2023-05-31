import Direction from './direction' ;

interface GetWorkingTabsProps {
  direction: Direction
  relativeScroll: number
  tabs: HTMLElement[]
}

interface WorkingTabs {
  currentTab: HTMLElement
  nextTab: HTMLElement
}

export default function getWorkingTabs({
  tabs, 
  direction, 
  relativeScroll, 
}: GetWorkingTabsProps): WorkingTabs {
  const isDirectionRight = direction === Direction.RIGHT;

  const currentTab = isDirectionRight ? tabs[Math.floor(relativeScroll)] : tabs[Math.ceil(relativeScroll)];
  const nextTab = isDirectionRight ? tabs[Math.ceil(relativeScroll)] : tabs[Math.floor(relativeScroll)];
  return { currentTab, nextTab }
}
