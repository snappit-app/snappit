import "./index.css";

import { render } from "solid-js/web";

import SettingsApp from "@/apps/settings/settings_app";

render(() => <SettingsApp />, document.getElementById("root") as HTMLElement);
