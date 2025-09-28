import { Accessor } from "solid-js";

import { RegionCaptureParams } from "@/shared/tauri/region_capture_api";
import { TextSnapQrResponse } from "@/shared/tauri/text_snap_res";

export type qrFrame = {
  size: number;
  center: { x: number; y: number };
};

export type createQrScannerOptions = {
  isActive: Accessor<boolean>;
  onScanSuccess: (content: string) => Promise<void> | void;
  onScanFailure?: () => Promise<void> | void;
};

export type qrScannerInstance = {
  frame: Accessor<qrFrame | undefined>;
  scan: (frame: RegionCaptureParams) => Promise<TextSnapQrResponse | undefined>;
  isScanning: Accessor<boolean>;
};
