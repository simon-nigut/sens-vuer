// @ts-nocheck

import { FC, useEffect, useRef, useState } from "react";
import {
	init,
	RenderingEngine,
	Enums,
	imageLoader,
	metaData,
	getRenderingEngine,
	setVolumesForViewports,
	volumeLoader,
} from "@cornerstonejs/core";
import type { Types } from "@cornerstonejs/core";
import { ToolGroupManager } from "@cornerstonejs/tools";
import registerWebImageLoader from "../cornerstone/loaders/registerWebImageLoader";
import hardcodedMetaDataProvider from "../cornerstone/hardcodedMetaDataProvider";
import { useEffectOnce } from "../lib/useEffectOnce";

const { ViewportType, OrientationAxis } = Enums;

const imageIds = [
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1460.png",
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1461.png",
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1462.png",
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1463.png",
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1464.png",
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1465.png",
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1466.png",
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1467.png",
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1468.png",
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1469.png",
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1470.png",
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1471.png",
	"web:https://cs3d-jpg-example.s3.us-east-2.amazonaws.com/a_vm1472.png",
];

const Demo: FC = () => {
	const [sliceIndex, setSliceIndex] = useState(0);
	const [invert, setInvert] = useState(false);

	const element1Ref = useRef<HTMLDivElement>(null);
	const element2Ref = useRef<HTMLDivElement>(null);
	const element3Ref = useRef<HTMLDivElement>(null);
	const element4Ref = useRef<HTMLDivElement>(null);

	const renderingEngineId = "myRenderingEngine";
	const volumeId = "cornerstoneStreamingImageVolume:COLOR_VOLUME";

	useEffectOnce(() => {
		const runDemo = async () => {
			await init();
			registerWebImageLoader(imageLoader);

			metaData.addProvider(
				(type, imageId) => hardcodedMetaDataProvider(type, imageId, imageIds),
				10000,
			);

			const renderingEngine = new RenderingEngine(renderingEngineId);

			const toolGroupId = "toolGroup";
			let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
			if (!toolGroup) {
				toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
			}

			toolGroup.addViewport("COLOR_STACK", renderingEngineId);
			toolGroup.addViewport("COLOR_VOLUME_1", renderingEngineId);
			toolGroup.addViewport("COLOR_VOLUME_2", renderingEngineId);
			toolGroup.addViewport("COLOR_VOLUME_3", renderingEngineId);

			const viewportInputArray: Types.IRenderingEngineViewportInput[] = [
				{
					viewportId: "COLOR_STACK",
					type: ViewportType.STACK,
					element: element1Ref.current!,
				},
				{
					viewportId: "COLOR_VOLUME_1",
					type: ViewportType.ORTHOGRAPHIC,
					element: element2Ref.current!,
				},
				{
					viewportId: "COLOR_VOLUME_2",
					type: ViewportType.ORTHOGRAPHIC,
					element: element3Ref.current!,
					defaultOptions: { orientation: OrientationAxis.CORONAL },
				},
				{
					viewportId: "COLOR_VOLUME_3",
					type: ViewportType.ORTHOGRAPHIC,
					element: element4Ref.current!,
					defaultOptions: { orientation: OrientationAxis.SAGITTAL },
				},
			];

			renderingEngine.setViewports(viewportInputArray);

			const volume = await volumeLoader.createAndCacheVolume(volumeId, {
				imageIds,
			});
			await volume.load();

			await setVolumesForViewports(
				renderingEngine,
				[{ volumeId }],
				["COLOR_VOLUME_1", "COLOR_VOLUME_2", "COLOR_VOLUME_3"],
			);

			const stackViewport = renderingEngine.getViewport("COLOR_STACK");
			await stackViewport.setStack(imageIds);
			stackViewport.render();
		};

		runDemo();

		// Cleanup function to destroy the rendering engine on unmount
		return () => {
			const renderingEngine = getRenderingEngine(renderingEngineId);
			renderingEngine?.destroy();
		};
	}, []);

	const handleSliceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = Number(e.target.value);
		setSliceIndex(value);

		const renderingEngine = getRenderingEngine(renderingEngineId);
		const viewport = renderingEngine.getViewport(
			"COLOR_STACK",
		) as Types.IStackViewport;
		viewport.setImageIdIndex(value);
		viewport.render();
	};

	const handleInvertClick = () => {
		const renderingEngine = getRenderingEngine(renderingEngineId);
		const viewport = renderingEngine.getViewport(
			"COLOR_STACK",
		) as Types.IStackViewport;

		viewport.setProperties({ invert: !invert });
		setInvert(!invert);
		viewport.render();
	};

	return (
		<div style={{ padding: "10px" }}>
			<h2>Web Color Images Demo</h2>

			<div
				ref={element1Ref}
				style={{ width: "500px", height: "500px", marginBottom: "10px" }}
			/>
			<div style={{ marginBottom: "10px" }}>
				<label>Slice Index: </label>
				<input
					type="range"
					min={0}
					max={imageIds.length - 1}
					value={sliceIndex}
					onChange={handleSliceChange}
				/>
				<span> {sliceIndex}</span>
			</div>
			<button onClick={handleInvertClick}>
				{invert ? "Reset Invert" : "Invert"}
			</button>

			<div style={{ display: "flex", marginTop: "20px", gap: "10px" }}>
				<div ref={element2Ref} style={{ width: "300px", height: "300px" }} />
				<div ref={element3Ref} style={{ width: "300px", height: "300px" }} />
				<div ref={element4Ref} style={{ width: "300px", height: "300px" }} />
			</div>
		</div>
	);
};

export default Demo;