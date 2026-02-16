import "./index.css";

import { render } from "solid-js/web";

import SettingsApp from "@/apps/settings/settings_app";
import { applyPlatformStyles } from "@/shared/theme/platform";

applyPlatformStyles();

render(() => <SettingsApp />, document.getElementById("root") as HTMLElement);
