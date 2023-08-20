import { Direction } from "./utils";
import afterFrame from "./utils/afterFrame";
import ownerWindow from "./utils/ownerWindow";

export interface ScrollManagerConstructorParams {
  scrollTarget: HTMLElement
  axis: 'x' | 'y'  
  resizeHandler?: (value?: any) => void
  scrollHandler?: (value?: any) => void
}

export default class ScrollManager {
  private scrollTarget: HTMLElement;
  public resizeObserver;
  private previousScrollPosition = 0;
  private __updateScheduled = false;
  private axis;
  private resizeHandler?: (value?: any) => void
  private scrollHandler?: (value?: any) => void

  constructor({scrollTarget, axis='x', scrollHandler, resizeHandler}: ScrollManagerConstructorParams) {
    this.scrollTarget = scrollTarget;
    this.axis = axis;
    this.scrollHandler = scrollHandler;
    this.resizeHandler = resizeHandler;

    this.scrollTarget.addEventListener("scroll", () => {
      if (!this.__updateScheduled) {
        this.scheduleUpdate();
        this.__updateScheduled = true;
      }
    });

    const win = ownerWindow(this.scrollTarget);

    this.resizeHandler && win.addEventListener('resize', this.resizeHandler);

    if (typeof ResizeObserver !== 'undefined' && this.resizeHandler) {
      this.resizeObserver = new ResizeObserver(this.resizeHandler);
      this.resizeObserver.observe(this.scrollTarget);
    }
  }

  getScrollPosition = () =>  {
    return this.axis === 'x' ? this.scrollTarget.scrollLeft : this.scrollTarget.scrollTop;
  }

  getScrollDirection = () => {
    return this.previousScrollPosition <= this.getScrollPosition() 
      ? ( this.axis === 'x' ? Direction.RIGHT : Direction.UP )
      : ( this.axis === 'x' ? Direction.LEFT : Direction.DOWN );
  }

  hasScrolled = () => {
    return this.previousScrollPosition !== this.getScrollPosition();
  }

  scheduleUpdate = () => {
    afterFrame(() => {
      this.update();
    });
  }

  update = () => {
    if (this.hasScrolled()) {
      this.scrollHandler && this.scrollHandler({target: this.scrollTarget});
      this.previousScrollPosition = this.getScrollPosition();
      this.scheduleUpdate();
    } else {
      this.__updateScheduled = false;
    }
  }

  cleanup = () => {
    this.scrollHandler && this.scrollTarget?.removeEventListener("scroll", this.scrollHandler);
    this.resizeObserver?.disconnect();
    const win = ownerWindow(this.scrollTarget);
    this.resizeHandler && win.removeEventListener("resize", this.resizeHandler);
  }

}