import "./index.css";

import { render } from "solid-js/web";

import SnapOverlay from "./snap_overlay";

render(() => <SnapOverlay />, document.getElementById("root") as HTMLElement);
