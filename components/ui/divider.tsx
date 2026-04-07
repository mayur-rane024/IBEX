import { cn } from "@/lib/utils";

function Divider({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="divider"
      className={cn("h-px w-full bg-border", className)}
      {...props}
    />
  );
}

export { Divider };
