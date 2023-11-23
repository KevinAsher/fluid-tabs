import animateScrollTo, { type IUserOptions } from "animated-scroll-to";
import FluidTabsManager from "./FluidTabsManager";

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

export interface TabPanelManagerConstructorParams {
  element: HTMLElement;
  controller: FluidTabsManager;

  /**
   * Customize on tab click scroll animation.
   * @see https://github.com/Stanko/animated-scroll-to#options
   */
  animateScrollToOptions?: IUserOptions;
}

export default class TabPanelManager {
  public element: HTMLElement;
  private animateScrollToOptions?: IUserOptions;
  public controller: FluidTabsManager;

  constructor({
    element,
    animateScrollToOptions,
    controller,
  }: TabPanelManagerConstructorParams) {
    this.element = element;
    this.animateScrollToOptions = animateScrollToOptions;
    this.controller = controller;
  }

  resizeHandler = () => {
    this.element.scrollLeft =
      this.controller.getIndex() * this.element.clientWidth;
  };

  animateToPanel = (index: number) => {
    /* Animate scrolling to the relevant tab panel */
    this.element.style.scrollSnapType = "none";

    animateScrollTo([index * this.element.getBoundingClientRect().width, 0], {
      minDuration: 500,
      maxDuration: 800,
      easing: easeInOutCubic,
      ...this.animateScrollToOptions,
      elementToScroll: this.element,
      cancelOnUserAction: false,
    })
      .then((hasScrolledToPosition) => {
        if (hasScrolledToPosition) {
          this.controller.canChangeTab = true;

          this.element.style.scrollSnapType = "x mandatory";

          // On ios < 15, setting scroll-snap-type resets the scroll position
          // so we need to reajust it to where it was before.
          this.element.scrollLeft =
            index * this.element.getBoundingClientRect().width;
        }
      })
      .catch(() => {
        this.element.style.scrollSnapType = "x mandatory";
      });
  };
}
