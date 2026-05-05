import React from "react";
import { Platform, View } from "react-native";

import { BG_COLOR } from "../utils/heatmap";

type Props = { visitCounts?: Record<string, number> };

let MapView: React.ComponentType<Props>;

if (Platform.OS === "web") {
  // CanvasKit (wasm) must be loaded before mounting any Skia component.
  const {
    WithSkiaWeb,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require("@shopify/react-native-skia/lib/module/web");

  // Metro dev server doesn't serve canvaskit.wasm with the right MIME type,
  // so we point CanvasKit at the jsdelivr CDN copy on web.
  const opts = {
    locateFile: (file: string) =>
      `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.40.0/bin/full/${file}`,
  };

  MapView = (props: Props) => (
    <WithSkiaWeb
      opts={opts}
      getComponent={() => import("./DotMap")}
      componentProps={props}
      fallback={<View style={{ flex: 1, backgroundColor: BG_COLOR }} />}
    />
  );
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MapView = require("./DotMap").default;
}

export default MapView;
