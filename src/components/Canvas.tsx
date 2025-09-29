import { useRef, useState } from "react";
import {
  Enums as CoreEnums,
  type Types,
} from "@cornerstonejs/core";
import {
  addTool,
  PanTool,
  ToolGroupManager,
  ZoomTool,
  Enums as ToolsEnums,
} from "@cornerstonejs/tools";
import { Loader2 } from "lucide-react";
import { useViewerStore } from "@/store/viewerStore";
import { useEffectOnce } from "@/lib/useEffectOnce";

type CanvasProps = {
  viewportId: string;
  enableDrop?: boolean; 
};

export default function Canvas({
  viewportId,
  enableDrop = true,
}: CanvasProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [zoom, _] = useState(1);

  const { renderImage, stack, isLoading, renderingEngineId, renderingEngine } = useViewerStore();

  const loading = isLoading[viewportId] ?? false; // per-viewport flag

  useEffectOnce(() => {
    if (!renderingEngine || !elementRef.current) return;
  
    // Only enable this element if it hasn't been enabled yet
    try {
      renderingEngine.enableElement({
        viewportId,
        type: CoreEnums.ViewportType.STACK,
        element: elementRef.current,
      });
    } catch (err) {
      console.warn(`Viewport ${viewportId} may already be enabled`, err);
    }
  
    const toolGroupId = `toolgroup-${viewportId}`;
    let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    if (!toolGroup) toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
    if (!toolGroup) {
      console.error("Failed to create or get tool group");
      return;
    }
  
    addTool(ZoomTool);
    addTool(PanTool);
  
    toolGroup.addTool(ZoomTool.toolName);
    toolGroup.addTool(PanTool.toolName);
  
    toolGroup.addViewport(viewportId, renderingEngineId);
  
    toolGroup.setToolActive(PanTool.toolName, {
      bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
    });
    toolGroup.setToolActive(ZoomTool.toolName, {
      bindings: [{ mouseButton: ToolsEnums.MouseBindings.Wheel }],
    });

    const viewport = renderingEngine.getViewport(viewportId) as Types.IStackViewport;
    console.log(stack);

    if (viewport && stack.length) {
      viewport.setStack(stack).then(() => viewport.render());
    }
  
  });

  return (
    <div
      ref={elementRef}
      className={`relative w-full h-full bg-gray-800 transition-all ${
        isDraggingOver ? "border-4 border-blue-500" : ""
      }`}
      onDragOver={(e) => {
        if (!enableDrop) return;
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragEnter={(e) => {
        if (!enableDrop) return;
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        if (!enableDrop) return;
        e.preventDefault();
        setIsDraggingOver(false);

        const imageId = e.dataTransfer.getData("imageId");
        if (imageId) renderImage(imageId, viewportId);
      }}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm z-10">
          <Loader2 className="animate-spin text-white w-12 h-12" />
        </div>
      )}

      {/* Zoom overlay */}
      <div className="z-10 absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
        Zoom: {(zoom * 100).toFixed(0)}%
      </div>
    </div>
  );
}
