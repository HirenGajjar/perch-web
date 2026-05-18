import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `Perch | ${title}` : 'Perch';
    return () => {
      document.title = 'Perch';
    };
  }, [title]);
}
