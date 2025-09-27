import { Accessor } from "solid-js";

import { RegionCaptureParams } from "@/shared/tauri/region_capture_api";

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
  scan: (frame: RegionCaptureParams) => Promise<string | undefined>;
  isScanning: Accessor<boolean>;
};
