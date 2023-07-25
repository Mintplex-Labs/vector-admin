import { useRef, useEffect } from 'react';
import JAZZ from '@metamask/jazzicon';

export default function Jazzicon({ size = 10, uid = '' }) {
  const divRef = useRef(null);
  const seed = uid
    ? toPseudoRandomInteger(uid)
    : Math.floor(100000 + Math.random() * 900000);
  const result = JAZZ(size, seed);

  useEffect(() => {
    function add() {
      if (!divRef || !divRef.current) return null;
      divRef?.current?.appendChild(result);
    }
    add();
  }, []);

  return <div className="flex" ref={divRef} />;
}

function toPseudoRandomInteger(uidString = '') {
  var numberArray = [uidString.length];
  for (var i = 0; i < uidString.length; i++) {
    numberArray[i] = uidString.charCodeAt(i);
  }

  return numberArray.reduce((a, b) => a + b, 0);
}
