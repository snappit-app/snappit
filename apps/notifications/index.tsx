import "./index.css";

import { render } from "solid-js/web";

import NotificationApp from "@/apps/notifications/notification_app";

render(() => <NotificationApp />, document.getElementById("root") as HTMLElement);
