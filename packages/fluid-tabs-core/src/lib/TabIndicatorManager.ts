import {
  calculateTransform,
  Direction,
  getWorkingTabs,
  transformCss,
} from "./utils";

export default class TabIndicatorManager {
  private tabs: TabIndicatorManagerConstructorParams["tabs"];
  private previousTab: HTMLElement | null = null;
  public element: TabIndicatorManagerConstructorParams["element"];

  // @ts-expect-error ScrollTimeline is not yet in the TS
  private scrollTimeline: ScrollTimeline | null = null;
  private tabIndicatorAnimation: Animation | null = null;
  private disableScrollTimeline = false;

  constructor({
    element,
    tabPanels,
    tabs,
    disableScrollTimeline,
  }: TabIndicatorManagerConstructorParams) {
    this.element = element;
    this.tabs = tabs;
    this.disableScrollTimeline =
      !("ScrollTimeline" in window) || disableScrollTimeline;

    if (!this.disableScrollTimeline) {
      // @ts-expect-error ScrollTimeline is not yet in the TS
      this.scrollTimeline = new ScrollTimeline({
        source: tabPanels,
        axis: "inline",
      });
    }
  }

  resizeHandler = (currentTab: HTMLElement) => {
    this.element.style.transform = transformCss(currentTab.offsetLeft, 1);
    this.element.style.width = `${currentTab.clientWidth}px`;
  };

  update = ({
    relativeScroll,
    direction,
  }: {
    relativeScroll: number;
    direction: Direction;
  }) => {
    const { currentTab, nextTab } = getWorkingTabs({
      direction,
      relativeScroll,
      tabs: this.tabs,
    });

    if (this.disableScrollTimeline) {
      const { translateX, scaleX } = calculateTransform({
        currentTab,
        nextTab,
        direction,
        relativeScroll,
      });

      requestAnimationFrame(() => {
        this.element.style.transform = transformCss(translateX, scaleX);
      });
    }

    // currentTab will be previousTab until there is a tab switch.
    if (this.previousTab === currentTab) return;

    // set previous tab for next scroll event
    this.previousTab = currentTab;

    requestAnimationFrame(() => {
      this.element.style.width = currentTab.clientWidth + "px";

      if (!this.disableScrollTimeline) {
        const transform = this.tabs.map((tab) => {
          const scaleX = tab.clientWidth / currentTab.clientWidth;
          const translateX = tab.offsetLeft;

          return transformCss(translateX, scaleX);
        });

        this.tabIndicatorAnimation?.cancel();
        this.tabIndicatorAnimation = this.element.animate(
          { transform },
          {
            fill: "both",
            // @ts-expect-error ScrollTimeline is not yet in the TS
            timeline: this.scrollTimeline,
          },
        );
      }
    });
  };
}

export interface TabIndicatorManagerConstructorParams {
  element: HTMLElement;
  tabPanels: HTMLElement;
  tabs: HTMLElement[];
  disableScrollTimeline?: boolean;
}
