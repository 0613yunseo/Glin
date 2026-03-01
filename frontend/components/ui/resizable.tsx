"use client";

import * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "./utils";

// ✅ 타입 정의에 export가 안 잡히는 경우가 있어서 any로 안전 우회
const PanelGroup = (ResizablePrimitive as any).PanelGroup as React.ComponentType<any>;
const Panel = (ResizablePrimitive as any).Panel as React.ComponentType<any>;
const PanelResizeHandle = (ResizablePrimitive as any).PanelResizeHandle as React.ComponentType<any>;

function ResizablePanelGroup({
  className,
  ...props
}: { className?: string } & Record<string, any>) {
  return (
    <PanelGroup
      data-slot="resizable-panel-group"
      className={cn("flex h-full w-full", className)}
      {...props}
    />
  );
}

function ResizablePanel({
  className,
  ...props
}: { className?: string } & Record<string, any>) {
  return (
    <Panel
      data-slot="resizable-panel"
      className={cn("h-full w-full", className)}
      {...props}
    />
  );
}

function ResizableHandle({
  className,
  withHandle = false,
  ...props
}: { className?: string; withHandle?: boolean } & Record<string, any>) {
  return (
    <PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        "bg-border relative flex w-px items-center justify-center",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2",
        "focus-visible:ring-ring focus-visible:outline-hidden focus-visible:ring-1",
        "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        className,
      )}
      {...props}
    >
      {withHandle ? (
        <div
          data-slot="resizable-handle-grip"
          className={cn(
            "bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border",
            "data-[panel-group-direction=vertical]:h-3 data-[panel-group-direction=vertical]:w-4",
          )}
        >
          <div className="bg-muted-foreground/40 h-2.5 w-0.5 rounded-full" />
          <div className="bg-muted-foreground/40 ml-0.5 h-2.5 w-0.5 rounded-full" />
        </div>
      ) : null}
    </PanelResizeHandle>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };