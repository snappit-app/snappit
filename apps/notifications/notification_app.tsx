import { Show } from "solid-js";

import { NotificationItem } from "@/apps/notifications/notification";
import { createNotificationVisible } from "@/shared/libs/notification_visible";
import { Theme } from "@/shared/theme";

function NotificationApp() {
  Theme.create();
  const [visible, target, payload, data] = createNotificationVisible();

  return (
    <Show when={visible() && target()}>
      {(target) => <NotificationItem target={target} payload={payload} data={data} />}
    </Show>
  );
}

export default NotificationApp;
