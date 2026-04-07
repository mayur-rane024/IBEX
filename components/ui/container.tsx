import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"div"> & {
  size?: "md" | "lg" | "xl";
};

const sizeMap = {
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
};

function Container({
  className,
  size = "lg",
  ...props
}: Props) {
  return (
    <div
      data-slot="container"
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeMap[size], className)}
      {...props}
    />
  );
}

export { Container };
