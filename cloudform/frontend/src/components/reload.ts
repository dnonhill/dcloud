import { useState } from 'react';

export function useReload() {
  const [reloadFlag, setReloadFlag] = useState<boolean>(true);
  return {
    reloadFlag,
    reload: () => setReloadFlag(!reloadFlag),
  };
}
