// SolidJS directive typings for TSX (VS Code IntelliSense)
// Allows using `use:draggable` and `use:droppable` without TS errors.
// Import the module to ensure we augment existing types instead of shadowing them.
import "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      // From @thisbeyond/solid-dnd: accepts optional config with skipTransform
      // Support boolean to allow bare usage: `<div use:draggable />`
      draggable?: boolean | { skipTransform?: boolean };
      droppable?: boolean | { skipTransform?: boolean };
    }
  }
}
