import ImageInput from "@/components/ImageInput";
import { useEffectOnce } from "@/lib/useEffectOnce";
import { useRef } from "react";
import {
	init,
	RenderingEngine,
	imageLoader,
	metaData,
	getRenderingEngine,
  Enums,
} from "@cornerstonejs/core";
import type { Types } from "@cornerstonejs/core";
import { ToolGroupManager } from "@cornerstonejs/tools";
import registerWebImageLoader from "../cornerstone/loaders/registerWebImageLoader";
import hardcodedMetaDataProvider from "../cornerstone/hardcodedMetaDataProvider";

function Viewer() {
  const element1Ref = useRef<HTMLDivElement>(null);

  const renderingEngineId = "myRenderingEngine";
  const stackViewportId = "COLOR_STACK";


  useEffectOnce(() => {
		const runDemo = async () => {
			await init();
			registerWebImageLoader(imageLoader);

			metaData.addProvider(
				(type, imageId) => hardcodedMetaDataProvider(type, imageId, []),
				10000,
			);

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
			toolGroup.addViewport("COLOR_STACK", renderingEngineId);

			const viewportInputArray: Types.PublicViewportInput[] = [
				{
					viewportId: "COLOR_STACK",
					type: Enums.ViewportType.STACK,
					element: element1Ref.current!,
				},
			];

			renderingEngine.setViewports(viewportInputArray);
		};

		runDemo();

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
        <ImageInput renderingEngineId={renderingEngineId} stackViewportId={stackViewportId} onImagesAdded={() => console.log('Images added')} />
      </div>

      {/* Main viewport */}
      <div className="w-4/5">
        <div
          ref={element1Ref}
          className="w-full h-full bg-gray-800"
        />
      </div>

    </div>
  );
}

export default Viewer;
