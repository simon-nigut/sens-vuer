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
import Toolbox from "@/components/Toolbox";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

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
    <div className="flex flex-col h-screen w-screen">
      {/* Navbar */}
      <div className="px-4 py-2 bg-card flex justify-between items-center shadow-lg">
        <div className="flex space-x-3 items-center">
          <img src="/logo.svg" alt="Sens-Vuer Logo" className="h-8" />
          <span className="font-bold tracking-wide text-2xl">Sens-Vuer</span>
        </div>
        <Toolbox />
        <Button ><Sparkles />AI Analysis</Button>
      </div>
      
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
            viewMode === 'dual-comparison' ? "grid grid-cols-2 gap-2" : "flex"
          }`}
        >
          <Canvas
            key={`${stackViewportId}-${viewMode}`}
            viewportId={stackViewportId}
          />

          {viewMode === 'dual-comparison' && (
            <Canvas viewportId="dual-comparison_viewport" />
          )}
        </div>
      </div>
    </div>
  );
}
