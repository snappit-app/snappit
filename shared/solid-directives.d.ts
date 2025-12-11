import "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      tooltip?:
        | string
        | {
            content: JSX.Element | string | (() => JSX.Element);
            offset?: number;
            show?: Accessor<boolean>;
          };
      clickOutside: (e: MouseEvent) => void;
    }
  }
}
