import { RefCallback, useCallback, useState } from "react";

export default function useRefCallback(): [
  HTMLElement | null,
  RefCallback<HTMLElement>,
] {
  const [element, setElement] = useState<HTMLElement | null>(null);

  const setElementCallback = useCallback((el: HTMLElement | null) => {
    setElement(el);
  }, []);

  return [element, setElementCallback];
}
