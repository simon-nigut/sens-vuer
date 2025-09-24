import ImageInput from "@/components/ImageInput";
import { useEffectOnce } from "@/lib/useEffectOnce";
import { useRef } from "react";
import {
	init as coreInit,
	RenderingEngine,
	imageLoader,
	metaData,
	getRenderingEngine,
	Enums as CoreEnums,
} from "@cornerstonejs/core";
import type { Types } from "@cornerstonejs/core";
import { addTool, init as cornerstoneToolsInit, ToolGroupManager, WindowLevelTool, ZoomTool, Enums as ToolsEnums } from "@cornerstonejs/tools";
import registerWebImageLoader from "../cornerstone/loaders/registerWebImageLoader";
import hardcodedMetaDataProvider from "../cornerstone/hardcodedMetaDataProvider";

function Viewer() {
  const element1Ref = useRef<HTMLDivElement>(null);

  const renderingEngineId = "myRenderingEngine";
  const stackViewportId = "COLOR_STACK";


  useEffectOnce(() => {
		const runDemo = async () => {
			await coreInit();
			await cornerstoneToolsInit();
			registerWebImageLoader(imageLoader);

			metaData.addProvider(
				(type, imageId) => hardcodedMetaDataProvider(type, imageId, []),
				10000,
			);

			addTool(ZoomTool);
			addTool(WindowLevelTool);

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
			toolGroup.addTool(WindowLevelTool.toolName);
			toolGroup.addViewport("COLOR_STACK", renderingEngineId);

			const viewportInputArray: Types.PublicViewportInput[] = [
				{
					viewportId: "COLOR_STACK",
					type: CoreEnums.ViewportType.STACK,
					element: element1Ref.current!,
				},
			];

			renderingEngine.setViewports(viewportInputArray);

			toolGroup.setToolActive(WindowLevelTool.toolName, {
			bindings: [
				  {
					mouseButton: ToolsEnums.MouseBindings.Primary, // Left Click
				  },
				],
			});
			  
			toolGroup.setToolActive(ZoomTool.toolName, {
			bindings: [
				{
				mouseButton: ToolsEnums.MouseBindings.Wheel, // Right Click
				},
			],
			});
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
