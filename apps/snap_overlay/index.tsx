import "./index.css";

import { render } from "solid-js/web";

import { applyPlatformStyles } from "@/shared/theme/platform";

import SnapOverlayApp from "./snap_overlay_app";

applyPlatformStyles();

render(() => <SnapOverlayApp />, document.getElementById("root") as HTMLElement);
