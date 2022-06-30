import React, { useRef, useEffect } from 'react';

export default function useIsTouchingRef(ref: React.RefObject<HTMLElement>) {
  const isTouchingRef = useRef(false);

  useEffect(() => {

    function setTouchingFlag() {
      isTouchingRef.current = true;
    }

    function unsetTouchingFlag() {
      isTouchingRef.current = false;
    }

    ref.current?.addEventListener('touchstart', setTouchingFlag, {passive: true});
    ref.current?.addEventListener('touchend', unsetTouchingFlag, {passive: true});
    return () => {
      ref.current?.removeEventListener('touchstart', setTouchingFlag);
      ref.current?.removeEventListener('touchend', unsetTouchingFlag);
    }
  }, []);

  return isTouchingRef;
}