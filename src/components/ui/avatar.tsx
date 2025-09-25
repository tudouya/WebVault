import Image, { type ImageProps } from "next/image"
import * as React from "react"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = "Avatar"

type AvatarImageProps = Omit<ImageProps, "alt"> & { alt?: string }

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  (
    { className, alt, width, height, sizes, priority, loading, unoptimized = true, ...rest },
    ref
  ) => {
    const hasDimensions = typeof width === "number" && typeof height === "number"
    const resolvedPriority = priority ?? false
    const resolvedLoading = resolvedPriority ? undefined : loading ?? "lazy"

    return (
      <Image
        ref={ref}
        alt={alt || "Avatar"}
        className={cn("aspect-square h-full w-full object-cover", className)}
        width={hasDimensions ? width : undefined}
        height={hasDimensions ? height : undefined}
        fill={!hasDimensions}
        sizes={sizes ?? "2.5rem"}
        priority={resolvedPriority}
        loading={resolvedLoading}
        unoptimized={unoptimized}
        {...rest}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
