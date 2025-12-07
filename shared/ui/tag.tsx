import { JSX } from "solid-js";

export function Tag(props: { children: JSX.Element }) {
  return (
    <div class="px-2 py-[1px] rounded-full text-[10px] bg-product text-product-foreground">
      {props.children}
    </div>
  );
}
