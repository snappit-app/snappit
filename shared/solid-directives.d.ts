import "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      tooltip?: string | { content: JSX.Element | string; offset?: number };
      clickOutside: (e: MouseEvent) => void;
    }
  }
}
