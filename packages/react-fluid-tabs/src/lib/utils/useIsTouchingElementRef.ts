import React, { useRef, useEffect } from 'react';

export default function useIsTouchingElementRef(el: HTMLElement | null) {
  const isTouchingRef = useRef(false);

  useEffect(() => {
    if (!el) return;

    function setTouchingFlag() {
      isTouchingRef.current = true;
    }

    function unsetTouchingFlag() {
      isTouchingRef.current = false;
    }

    el.addEventListener('touchstart', setTouchingFlag, {passive: true});
    el.addEventListener('touchend', unsetTouchingFlag, {passive: true});
    return () => {
      el.removeEventListener('touchstart', setTouchingFlag);
      el.removeEventListener('touchend', unsetTouchingFlag);
    }
  }, [el]);

  return isTouchingRef;
}