import { getRenderingEngine, type Types } from '@cornerstonejs/core';
import { Eclipse, Search, RotateCcw } from 'lucide-react';
import { useState, type FC } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useViewerStore } from "@/store/viewerStore";

interface ToolboxProps {}

const Toolbox: FC<ToolboxProps> = () => {
  const {
    renderingEngineId,
    renderedImageId,
    tool,
    setTool,
  } = useViewerStore();
  
  const [invert, setInvert] = useState(false);

  const onZoom = () => {
    if (!renderedImageId) return;

    setTool(tool === "zoom" ? null : "zoom");
  };

  const onInvert = () => {
    if (!renderedImageId) return;

    const newInvert = !invert;
    setTool(tool === "invert" ? null : "invert");
    setInvert(tool === "invert" ? false : newInvert);

    const renderingEngine = getRenderingEngine(renderingEngineId!);
    if (!renderingEngine) return;

    const viewport = renderingEngine.getViewport(
      "COLOR_STACK",
    ) as Types.IStackViewport;

    viewport.setProperties({ invert: newInvert });
    viewport.render();
  };

  const onReset = () => {
    if (!renderedImageId) return;

    const renderingEngine = getRenderingEngine(renderingEngineId!);
    if (!renderingEngine) return;

    const viewport = renderingEngine.getViewport(
      "COLOR_STACK",
    ) as Types.IStackViewport;

    viewport.resetCamera();
    viewport.resetProperties();
    viewport.render();
  };

  return (
    <div className="flex gap-x-1 bg-gray-300 rounded-lg p-1">
      <ToolIcon
        icon={<Search />}
        onToggle={onZoom}
        tooltip="Zoom"
        toggled={tool === "zoom"}
        disabled={!renderedImageId}
      />
      <ToolIcon
        icon={<Eclipse />}
        onToggle={onInvert}
        tooltip="Invert colors"
        toggled={tool === "invert"}
        disabled={!renderedImageId}
      />
      <ToolIcon
        icon={<RotateCcw />}
        onToggle={onReset}
        tooltip="Reset Zoom/Position"
        toggled={false}
        disabled={!renderedImageId}
      />
    </div>
  );
};

interface ToolIconProps {
  icon: React.ReactNode;
  toggled: boolean;
  onToggle: () => void;
  tooltip: string;
  disabled?: boolean;
}

const ToolIcon = ({icon, toggled, onToggle, tooltip, disabled}: ToolIconProps) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <button
          disabled={disabled}
          className={`rounded-lg p-2 cursor-pointer transition ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : toggled
                ? "bg-blue-500 text-white hover:bg-blue-400"
                : "hover:bg-gray-300"
          }`}
          onClick={onToggle}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default Toolbox;
