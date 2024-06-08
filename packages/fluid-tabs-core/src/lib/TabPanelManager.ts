import animateScrollTo, { type IUserOptions } from "animated-scroll-to";

export default class TabPanelManager {
  public element: TabPanelManagerConstructorParams["element"];
  private animateScrollToOptions?: TabPanelManagerConstructorParams["animateScrollToOptions"];
  private getIndex: TabPanelManagerConstructorParams["getIndex"];

  constructor({
    element,
    animateScrollToOptions,
    getIndex,
  }: TabPanelManagerConstructorParams) {
    this.element = element;
    this.animateScrollToOptions = animateScrollToOptions;
    this.getIndex = getIndex;
  }

  getScrollPosition = (index: number = this.getIndex()) => {
    return index * this.element.getBoundingClientRect().width;
  }

  resizeHandler = () => {
    this.element.scrollLeft = this.getScrollPosition();
  };

  animateToPanel = (index: number) => {
    /* Animate scrolling to the relevant tab panel */
    this.element.style.scrollSnapType = "none";

    return animateScrollTo([this.getScrollPosition(index), 0], {
      minDuration: 500,
      maxDuration: 800,
      easing: easeInOutCubic,
      ...this.animateScrollToOptions,
      elementToScroll: this.element,
      cancelOnUserAction: false,
    })
      .then((hasScrolledToPosition) => {
        if (hasScrolledToPosition) {
          this.element.style.scrollSnapType = "x mandatory";

          // On ios < 15, setting scroll-snap-type resets the scroll position
          // so we need to reajust it to where it was before.
          this.element.scrollLeft = this.getScrollPosition(index);
        }

        return hasScrolledToPosition;
      })
      .catch(() => {
        this.element.style.scrollSnapType = "x mandatory";
      });
  };
}

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

export interface TabPanelManagerConstructorParams {
  element: HTMLElement;
  getIndex: () => number;

  /**
   * Customize on tab click scroll animation.
   * @see https://github.com/Stanko/animated-scroll-to#options
   */
  animateScrollToOptions?: IUserOptions;
}
