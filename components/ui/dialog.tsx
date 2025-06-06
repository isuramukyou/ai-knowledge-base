"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion"
import { useDrag } from "@use-gesture/react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { showClose?: boolean }
>(({ className, children, showClose = true, ...props }, ref) => {
  const [isDragging, setIsDragging] = React.useState(false)
  const [y, setY] = React.useState(0)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)

  // Reset state when dialog opens or closes
  React.useEffect(() => {
    const dialog = contentRef.current?.closest('[data-state]')
    const isOpen = dialog?.getAttribute('data-state') === 'open'
    
    if (isOpen) {
      setY(0)
      setIsDragging(false)
      // Reset scroll position to top
      if (contentRef.current) {
        contentRef.current.scrollTop = 0
      }
    } else {
      // Reset all states when dialog closes
      setY(0)
      setIsDragging(false)
    }
  }, [contentRef.current])

  const bind = useDrag(({ movement: [, my], down, velocity: [, vy], canceled }) => {
    // Allow dragging in both directions but prioritize downward movement
    const newY = down ? my : 0;
    setY(newY)
    setIsDragging(down)

    // Check if we're at the top of the modal content
    const scrollContainer = contentRef.current;
    const isAtTop = scrollContainer ? scrollContainer.scrollTop <= 1 : true; // Default to true if container not found

    // Close the dialog only if dragged down significantly or with enough downward velocity
    // and we're at the top of the content
    if (!down && my > 0 && isAtTop && (my > 30 || vy > 0.05)) {
      // Use the close button's click handler directly
      closeRef.current?.click()
      // Reset states after closing
      setY(0)
      setIsDragging(false)
    }

    if (canceled || (!down && my <= 0)) {
      setY(0) // Snap back if drag was cancelled or if swiped upward
    }
  }, { 
    axis: 'y',
    filterTaps: true,
    bounds: { top: -50, bottom: 300 },
    rubberband: true,
    preventScroll: false
  })

  return (
    <DialogPortal>
      <DialogOverlay />
      <AnimatePresence>
        <DialogPrimitive.Content
          ref={(node) => {
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
            contentRef.current = node
          }}
          asChild
          {...props}
        >
          <motion.div
            {...(bind() as HTMLMotionProps<"div">)}
            style={{ y }}
            initial={{ opacity: 0, top: "100%", left: "50%", x: "-50%" }}
            animate={{ opacity: 1, top: "50%", left: "50%", x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, top: "100%", left: "50%", x: "-50%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              mass: 0.5,
              opacity: { duration: 0.2 }
            }}
            className={cn(
              "fixed z-50 grid w-[calc(100%-2rem)] max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 mx-auto px-6 sm:px-8 sm:w-[calc(100%-4rem)] rounded-lg max-h-[90vh] overflow-y-auto overscroll-contain",
              isDragging && "cursor-grabbing",
              !isDragging && "cursor-grab",
              className
            )}
          >
            <div className="absolute left-1/2 top-2 h-1 w-12 -translate-x-1/2 rounded-full bg-gray-300" />
            {children}
            <DialogPrimitive.Close 
              ref={closeRef}
              className={cn(
                "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
                !showClose && "invisible"
              )}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </motion.div>
        </DialogPrimitive.Content>
      </AnimatePresence>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
