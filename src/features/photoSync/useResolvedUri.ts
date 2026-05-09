import { useEffect, useState } from "react";

import { resolveDisplayUris } from "./photoLibrary";

// ph:// URI를 RN Image가 인식하는 file://로 lazy 해석한다. 셀이 화면에 들어올
// 때만 호출되므로 큰 사진첩에서도 동시 호출 수가 visible window 크기로 제한된다.
// resolve 결과는 photoLibrary 모듈 캐시에 저장되어 재요청 시 즉시 반환한다.
//
// shouldDownloadFromNetwork는 true로 둔다 — lazy resolve가 호출된다는 건 사용자가
// 그 셀을 보고 있다는 뜻이고, iCloud-only 자산도 받아와야 빈 셀을 피할 수 있다.
export function useResolvedUri(id: string, uri: string): string | null {
  const [resolved, setResolved] = useState<string | null>(() =>
    uri.startsWith("ph://") ? null : uri
  );

  useEffect(() => {
    if (!uri.startsWith("ph://")) {
      setResolved(uri);
      return;
    }
    let cancelled = false;
    void (async () => {
      const result = await resolveDisplayUris(
        [{ id, uri }],
        { shouldDownloadFromNetwork: true }
      );
      if (cancelled) return;
      const next = result[id];
      if (next && !next.startsWith("ph://")) {
        setResolved(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, uri]);

  return resolved;
}
