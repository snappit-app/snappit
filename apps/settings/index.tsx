import "./index.css";

import { render } from "solid-js/web";

import Settings from "./settings";

render(() => <Settings />, document.getElementById("settings-root") as HTMLElement);
