export default class ActionController {
  public canChangeTab = true;
  public canAnimateScrollToPanel = true;

  changeActivePanel = async (runner: () => Promise<boolean | void>) => {
    this.canChangeTab = true;

    if (!this.canAnimateScrollToPanel) {
      this.canAnimateScrollToPanel = true;
      return;
    }

    this.canChangeTab = false;

    const hasSwitchedToPanel = await runner();

    if (hasSwitchedToPanel) {
      this.canChangeTab = true;
    }
  };

  changeActiveTab = (runner: () => void) => {
    if (this.canChangeTab) {
      runner();

      this.canAnimateScrollToPanel = false;
      this.canChangeTab = false;
    }
  };

}