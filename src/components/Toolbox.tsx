import { getRenderingEngine, type Types } from '@cornerstonejs/core';
import { Eclipse, Search } from 'lucide-react'
import { useState, type FC, type ForwardRefExoticComponent } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ToolboxProps {
  
}

const Toolbox: FC<ToolboxProps> = ({}) => {
  const [toggledTool, setToggledTool] = useState<string | null>(null);
  const [invert, setInvert] = useState(false);

  // TODO: make this state managed with zustand
  const renderingEngineId = "myRenderingEngine";


  // TODO: make it unable to use tools unless image is rendered, state managed with zustand

  const onZoom = () => {
    if (toggledTool === "zoom") {
      setToggledTool(null);
    } else {
      setToggledTool("zoom");
    }
  }

  const onInvert = () => {
    if (toggledTool === "invert") {
      setToggledTool(null);
      setInvert(false);
    } else {
      setToggledTool("invert");
      setInvert(true);
    }
    
    const renderingEngine = getRenderingEngine(renderingEngineId);
    if (!renderingEngine) {
      console.error("RenderingEngine not found");
      return;
    };
		const viewport = renderingEngine.getViewport(
			"COLOR_STACK",
		) as Types.IStackViewport;

		viewport.setProperties({ invert: !invert });
		setInvert(!invert);
		viewport.render();
  }

  return (
    <div className="flex gap-x-1">
      <ToolIcon icon={<Search />} onToggle={onZoom} tooltip="Zoom" toggled={toggledTool === "zoom"} />
      <ToolIcon icon={<Eclipse />} onToggle={onInvert} tooltip="Invert colors" toggled={toggledTool === "invert"} />
    </div>
  )
}

interface ToolIconProps {
  icon: ForwardRefExoticComponent,
  toggled: boolean,
  onToggle: () => void,
  tooltip: string,
}

const ToolIcon = ({icon, toggled, onToggle, tooltip}: ToolIconProps) => {

    const handleToggle = () => {
      onToggle();
    }

    return (
      <Tooltip>
        <TooltipTrigger>
          <button className={"rounded-lg p-2 cursor-pointer " + (toggled ? "bg-blue-500 text-white hover:bg-blue-400" : "hover:bg-gray-300")} onClick={handleToggle}>
              {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    )
}

export default Toolbox