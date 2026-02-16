import "./index.css";

import { render } from "solid-js/web";

import NotificationApp from "@/apps/notifications/notification_app";
import { applyPlatformStyles } from "@/shared/theme/platform";

applyPlatformStyles();

render(() => <NotificationApp />, document.getElementById("root") as HTMLElement);
