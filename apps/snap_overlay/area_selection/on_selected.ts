import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { load } from "@tauri-apps/plugin-store";

import { onColorRecognized } from "@/apps/snap_overlay/color_dropper/on_recognized";
import { onScanSuccess } from "@/apps/snap_overlay/qr-scan";
import { SNAPPIT_CONSTS } from "@/shared/constants";
import { ColorFormat, DEFAULT_COLOR_FORMAT, formatColor } from "@/shared/libs/color_format";
import { NotificationCenter } from "@/shared/notifications";
import { RegionCaptureApi, RegionCaptureParams } from "@/shared/tauri/region_capture_api";
import { ColorInfo } from "@/shared/tauri/screen_capture_api";
import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";

export async function onTextRecognized(text: string) {
  if (text) {
    await writeText(text);
    await NotificationCenter.notifyOcr(text);
  }
}

async function getFormattedColor(color: ColorInfo): Promise<string> {
  const store = await load(SNAPPIT_CONSTS.store.file);
  const format = ((await store.get<ColorFormat>(
    SNAPPIT_CONSTS.store.keys.preferred_color_format,
  )) ?? DEFAULT_COLOR_FORMAT) as ColorFormat;
  return formatColor(color.rgb, color.hex, format);
}

export async function onAreaSelected(selection: RegionCaptureParams) {
  SnapOverlayApi.hide();

  const res = await RegionCaptureApi.onCapture(selection);

  switch (res.kind) {
    case "qr":
      return onScanSuccess(res.payload);
    case "ocr":
      return onTextRecognized(res.payload.value);
    case "dropper": {
      const formattedColor = await getFormattedColor(res.payload);
      return onColorRecognized(res.payload, formattedColor);
    }
    default:
      return;
  }
}
