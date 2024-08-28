export default class ActionController {
  public canChangeTab = true;
  public canAnimateScrollToPanel = true;

  changeActivePanel = async (callback: () => Promise<boolean | void>) => {
    this.canChangeTab = true;

    if (!this.canAnimateScrollToPanel) {
      this.canAnimateScrollToPanel = true;
      return;
    }

    this.canChangeTab = false;

    const hasSwitchedToPanel = await callback();

    if (hasSwitchedToPanel) {
      this.canChangeTab = true;
    }
  };

  changeActiveTab = (callback: () => void) => {
    if (this.canChangeTab) {
      callback();

      this.canAnimateScrollToPanel = false;
      this.canChangeTab = false;
    }
  };

}