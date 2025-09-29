import ImageInput from "@/components/ImageInput";
import Canvas from "@/components/Canvas";
import { useViewerStore } from "@/store/viewerStore";
import { useEffectOnce } from "@/lib/useEffectOnce";
import { imageLoader, init as coreInit, metaData, RenderingEngine, getRenderingEngine } from "@cornerstonejs/core";
import {
  init as cornerstoneToolsInit,
} from "@cornerstonejs/tools";
import registerWebImageLoader from "@/cornerstone/loaders/registerWebImageLoader";
import hardcodedMetaDataProvider from "@/cornerstone/hardcodedMetaDataProvider";

export default function Viewer() {
  const { renderingEngineId, stackViewportId, setRenderingEngine, renderingEngine, viewMode } = useViewerStore();

  useEffectOnce(() => {
    const init = async () => {
      await coreInit();
      await cornerstoneToolsInit();
  
      registerWebImageLoader(imageLoader);
      metaData.addProvider(
        (type, imageId) => hardcodedMetaDataProvider(type, imageId, []),
        10000
      );
  
      const renderingEngine = new RenderingEngine(renderingEngineId);
      setRenderingEngine(renderingEngine);
    };
  
    init();
  
    return () => {
      const renderingEngine = getRenderingEngine(renderingEngineId);
      renderingEngine?.destroy();
    };
  });

  // TODO: make better loading message
  if (!renderingEngine) {
    return <div>Loading...</div>;
  }
  

  return (
    <div className="w-full h-full flex">
      {/* Sidebar for image selection */}
      <div className="w-1/5 py-6 px-4">
        <ImageInput
          renderingEngineId={renderingEngineId}
          stackViewportId={stackViewportId}
          onImagesAdded={() => console.log("Images added")}
        />
      </div>

      {/* Main viewer area */}
      <div
        className={`w-4/5 h-full ${
          viewMode === 'quad-comparison' ? "grid grid-cols-2 grid-rows-2 gap-2" : viewMode === 'dual-comparison' ? "grid grid-cols-2 gap-2" : "flex"
        }`}
      >
        <Canvas
          key={`${stackViewportId}-${viewMode}`}
          viewportId={stackViewportId}
        />

        {viewMode === 'dual-comparison' && (
          <Canvas viewportId="dual-comparison_viewport" />
        )}

        {viewMode === "quad-comparison" && (
          <>
            <Canvas viewportId="quad_viewport_1" />
            <Canvas viewportId="quad_viewport_2" />
            <Canvas viewportId="quad_viewport_3" />
          </>
        )}
      </div>
    </div>
  );
}
