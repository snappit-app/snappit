import { OverlayPortal, portalProps } from "@/shared/ui/overlay";

export function AreaSelection(props: portalProps) {
  return <OverlayPortal pos={props.pos} innerClass="border-1 border-white" />;
}
