import { useCallback, useState } from 'react';

export default function useTabPanelsRef() {
  const [tabPanels, setTabPanels] = useState<HTMLElement | null>(null);

  const setTabPanelsRef = useCallback((el: HTMLElement | null) => {
    setTabPanels(el);
  }, []);

  return {tabPanels, setTabPanelsRef};
}