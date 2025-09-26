import ImageInput from "@/components/ImageInput";
import { useEffectOnce } from "@/lib/useEffectOnce";
import { useRef, useState } from "react";
import {
  init as coreInit,
  RenderingEngine,
  imageLoader,
  metaData,
  getRenderingEngine,
  Enums as CoreEnums,
} from "@cornerstonejs/core";
import type { Types } from "@cornerstonejs/core";
import {
  addTool,
  init as cornerstoneToolsInit,
  ToolGroupManager,
  ZoomTool,
  Enums as ToolsEnums,
  PanTool,
} from "@cornerstonejs/tools";
import registerWebImageLoader from "../cornerstone/loaders/registerWebImageLoader";
import hardcodedMetaDataProvider from "../cornerstone/hardcodedMetaDataProvider";
import { Loader2 } from "lucide-react";
import { useViewerStore } from "@/store/viewerStore";

function Viewer() {
  const element1Ref = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [zoom, setZoom] = useState<number>(1);

  const {
    renderingEngineId,
    stackViewportId,
    renderImage,
    isLoading,
  } = useViewerStore();

  useEffectOnce(() => {
    const runViewer = async () => {
      await coreInit();
      await cornerstoneToolsInit();
      registerWebImageLoader(imageLoader);

      metaData.addProvider(
        (type, imageId) => hardcodedMetaDataProvider(type, imageId, []),
        10000
      );

      addTool(ZoomTool);
      addTool(PanTool);

      const renderingEngine = new RenderingEngine(renderingEngineId);

      const toolGroupId = "toolGroup";
      let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      if (!toolGroup) {
        toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
      }

      if (!toolGroup) {
        console.error("Failed to create or get tool group");
        return;
      }

      toolGroup.addTool(ZoomTool.toolName);
      toolGroup.addTool(PanTool.toolName);
      toolGroup.addViewport(stackViewportId, renderingEngineId);

      const viewportInputArray: Types.PublicViewportInput[] = [
        {
          viewportId: stackViewportId,
          type: CoreEnums.ViewportType.STACK,
          element: element1Ref.current!,
        },
      ];

      renderingEngine.setViewports(viewportInputArray);

      toolGroup.setToolActive(PanTool.toolName, {
        bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
      });

      toolGroup.setToolActive(ZoomTool.toolName, {
        bindings: [{ mouseButton: ToolsEnums.MouseBindings.Wheel }],
      });

      // 🔍 Listen to zoom changes
      const viewport = renderingEngine.getViewport(
        stackViewportId
      ) as Types.IStackViewport;

      if (viewport) {
        // initialize zoom
        setZoom(viewport.getZoom());

        const updateZoom = () => {
          setZoom(viewport.getZoom());
        };

        // Subscribe to CAMERA_MODIFIED event
        viewport.element?.addEventListener(
          CoreEnums.Events.CAMERA_MODIFIED,
          updateZoom
        );

        // Cleanup
        return () => {
          viewport.element?.removeEventListener(
            CoreEnums.Events.CAMERA_MODIFIED,
            updateZoom
          );
        };
      }
    };

    runViewer();

    // Cleanup function to destroy the rendering engine on unmount
		return () => {
			const renderingEngine = getRenderingEngine(renderingEngineId);
			renderingEngine?.destroy();
		};
  });

  return (
    <div className="w-full h-full flex">
      {/* Image selection bar */}
      <div className="w-1/5 py-6 px-4">
        <ImageInput
          renderingEngineId={renderingEngineId}
          stackViewportId={stackViewportId}
          onImagesAdded={() => console.log("Images added")}
        />
      </div>

      {/* Main viewport */}
      <div className="w-4/5 relative">
        <div
          ref={element1Ref}
          className={`w-full h-full bg-gray-800 transition-all ${
            isDraggingOver ? "border-4 border-blue-500" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isDraggingOver) setIsDraggingOver(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);

            const imageId = e.dataTransfer.getData("imageId");
            if (imageId) {
              renderImage(imageId);
            }
          }}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm z-10">
            <Loader2 className="animate-spin text-white w-12 h-12" />
          </div>
        )}

        {/* 🔍 Zoom overlay */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

export default Viewer;
