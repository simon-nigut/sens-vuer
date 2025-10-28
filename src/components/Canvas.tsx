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
  RectangleROITool,
  LengthTool,
  EllipticalROITool,
  ArrowAnnotateTool,
  Enums as ToolsEnums,
  EraserTool,
  WindowLevelTool,
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
  const { renderImage, stack, isLoading, renderingEngineId, renderingEngine, renderedImageIds, stackViewportId } = useViewerStore();
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isFresh, setIsFresh] = useState(!renderedImageIds[viewportId] && viewportId !== stackViewportId);
  
  const [zoom, setZoom] = useState(1);

  const loading = isLoading[viewportId] ?? false; // per-viewport flag

  useEffectOnce(() => {
    if (!renderingEngine || !elementRef.current) {
      console.error("ERROR WITH ENGINE");
      return;
    };
  
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
    addTool(WindowLevelTool);
    addTool(LengthTool);
    addTool(RectangleROITool);
    addTool(EllipticalROITool);
    addTool(ArrowAnnotateTool);
    addTool(EraserTool);
  
    toolGroup.addTool(ZoomTool.toolName);
    toolGroup.addTool(WindowLevelTool.toolName);
    toolGroup.addTool(PanTool.toolName);
    toolGroup.addTool(LengthTool.toolName);
    toolGroup.addTool(RectangleROITool.toolName);
    toolGroup.addTool(EllipticalROITool.toolName);
    toolGroup.addTool(ArrowAnnotateTool.toolName);
    toolGroup.addTool(EraserTool.toolName);

    // Deactivate all annotation tools first
    toolGroup.setToolPassive(PanTool.toolName);
    toolGroup.setToolPassive(WindowLevelTool.toolName);
    toolGroup.setToolPassive(LengthTool.toolName);
    toolGroup.setToolPassive(RectangleROITool.toolName);
    toolGroup.setToolPassive(EllipticalROITool.toolName);
    toolGroup.setToolPassive(ArrowAnnotateTool.toolName);
    toolGroup.setToolPassive(EraserTool.toolName);

    toolGroup.addViewport(viewportId, renderingEngineId);

    toolGroup.setToolActive(PanTool.toolName, {
      bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
    });
  
    toolGroup.setToolActive(ZoomTool.toolName, {
      bindings: [{ mouseButton: ToolsEnums.MouseBindings.Wheel }],
    });

    const viewport = renderingEngine.getViewport(viewportId) as Types.IStackViewport;
    if (viewport) {
      viewport.setStack(stack).then(() => {
        const renderedImageId = renderedImageIds[viewportId];
        console.log(viewportId);
        console.log(renderedImageId);
        if (renderedImageId) {
          renderImage(renderedImageId);
          viewport.render()
          console.log("Rendering image ", renderedImageId, "for viewport ", viewportId);
        }
      });
    }

    // Zoom updating
    if (viewport) {
      setZoom(viewport.getZoom());

      const updateZoom = () => {
        setZoom(viewport.getZoom());
      };

      viewport.element?.addEventListener(
        CoreEnums.Events.CAMERA_MODIFIED,
        updateZoom
      );
    }
  });

  return (
    <div
      ref={elementRef}
      className={`relative w-full h-full bg-secondary transition-all ${
        isDraggingOver ? "border-4 border-primary" : ""
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
        setIsFresh(false);
      }}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm z-10">
          <Loader2 className="animate-spin text-white w-12 h-12" />
        </div>
      )}

      {/* Zoom overlay */}
      <div className="z-10 absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
        Zoom: {(zoom * 100).toFixed(0)}%
      </div>

      {isFresh && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background">
          <div className="text-foreground-muted text-sm bg-secondary px-4 py-2 rounded-lg">
            Drag an image over
          </div>
        </div>
      )}
    </div>
  );
}
