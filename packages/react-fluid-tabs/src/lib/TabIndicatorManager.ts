import {
  calculateTransform,
  getKeyByValue,
  getWorkingTabs,
  transformCss,
} from "./utils";
import FluidTabsManager from "./FluidTabsManager";

export interface TabIndicatorManagerConstructorParams {
  element: HTMLElement;
  disableScrollTimeline?: boolean;
  controller: FluidTabsManager;
}

export default class TabIndicatorManager {
  private previousTab: HTMLElement | null = null;
  public element: HTMLElement;

  // @ts-expect-error ScrollTimeline is not yet in the TS
  private scrollTimeline: ScrollTimeline | null = null;
  private tabIndicatorAnimation: Animation | null = null;
  private disableScrollTimeline = false;
  private controller: FluidTabsManager;

  constructor({
    element,
    disableScrollTimeline,
    controller,
  }: TabIndicatorManagerConstructorParams) {
    this.element = element;
    this.disableScrollTimeline =
      !("ScrollTimeline" in window) || disableScrollTimeline;
    this.controller = controller;

    if (!this.disableScrollTimeline) {
      // @ts-expect-error ScrollTimeline is not yet in the TS
      this.scrollTimeline = new ScrollTimeline({
        source: this.controller.tabPanelManager.element,
        axis: "inline",
      });
    }
  }

  resizeHandler = () => {
    this.element.style.transform = transformCss(
      this.controller.getCurrentTab().offsetLeft,
      1,
    );
    this.element.style.width = `${
      this.controller.getCurrentTab().clientWidth
    }px`;
  };

  scrollDrivenTabChange = (relativeScroll: number) => {
    const closestIndexFromScrollPosition = Math.round(relativeScroll);
    const currentIndex = this.controller.getIndex()!;
    const surpassedScrollThreshold =
      Math.abs(relativeScroll - currentIndex) > this.controller.switchThreshold;

    if (
      closestIndexFromScrollPosition !== currentIndex &&
      surpassedScrollThreshold
    ) {
      this.controller.changeActiveTab(
        getKeyByValue(
          this.controller.valueToIndex,
          closestIndexFromScrollPosition,
        ),
      );
    }
  };

  updateTabIndicator = (relativeScroll: number) => {
    const direction = this.controller.scrollManager.getScrollDirection();

    const { currentTab, nextTab } = getWorkingTabs({
      direction,
      relativeScroll,
      tabs: this.controller.tabs,
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
        const transform = this.controller.tabs.map((tab) => {
          const scaleX = tab.clientWidth / currentTab.clientWidth;
          const translateX = tab.offsetLeft;

          return transformCss(translateX, scaleX);
        });

        this.tabIndicatorAnimation?.cancel();
        this.tabIndicatorAnimation = this.element.animate(
          { transform },
          {
            fill: "both",
            timeline: this.scrollTimeline,
          },
        );
      }
    });
  };

  scrollHandler = (event: any) => {
    // Total amount of pixels scrolled in the scroll container
    const scrollLeft = event.target.scrollLeft;

    // Scroll progress relative to the panel, e.g., 0.4 means we scrolled 40% of the first panel.
    // We can't use tabPanelsClientWidth here because we might get an outdated width from a screen orietation change
    // which will cause a scroll before tabPanelsClientWidth gets a chance to update.
    const relativeScroll =
      scrollLeft /
      this.controller.tabPanelManager.element.getBoundingClientRect().width;

    // If we are overscroll beyond the boundaries of the scroll container, we just return and do nothing (e.g. Safari browser).
    if (relativeScroll < 0 || relativeScroll > this.controller.tabs.length - 1)
      return;

    this.scrollDrivenTabChange(relativeScroll);
    this.updateTabIndicator(relativeScroll);
  };
}
