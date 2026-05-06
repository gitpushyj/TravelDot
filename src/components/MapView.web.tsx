import React from "react";
import { View } from "react-native";

import { BG_COLOR } from "../utils/heatmap";

type Props = Record<string, never>;

const {
  WithSkiaWeb,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
} = require("@shopify/react-native-skia/lib/module/web");

const opts = {
  locateFile: (file: string) =>
    `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.40.0/bin/full/${file}`,
};

const MapView: React.ComponentType<Props> = (props) => (
  <WithSkiaWeb
    opts={opts}
    getComponent={() => import("./DotMap")}
    componentProps={props}
    fallback={<View style={{ flex: 1, backgroundColor: BG_COLOR }} />}
  />
);

export default MapView;
