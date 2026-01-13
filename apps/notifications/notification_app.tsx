import { Show } from "solid-js";

import { NotificationItem } from "@/apps/notifications/notification";
import { createNotificationVisible } from "@/shared/libs/notification_visible";
import { Theme } from "@/shared/theme";

function NotificationApp() {
  Theme.create();
  const [visible, target, payload, data, notificationId] = createNotificationVisible();

  return (
    <Show when={visible() && target()} keyed>
      {(currentTarget) => (
        <NotificationItem
          target={() => currentTarget}
          payload={payload}
          data={data}
          notificationId={notificationId}
        />
      )}
    </Show>
  );
}

export default NotificationApp;
