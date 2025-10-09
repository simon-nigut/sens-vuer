import { type Types, utilities as csUtils } from '@cornerstonejs/core';
import {
  Eclipse,
  RotateCcw,
  SquareSplitHorizontal,
  Columns2,
  Grid2X2,
  Square,
  Ruler,
  Circle,
  PencilLine,
  Move,
  Undo,
  Redo,
  Eraser,
  Save,
} from 'lucide-react';
import { useEffect, useState, type FC, type JSX } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useViewerStore } from "@/store/viewerStore";
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  ToolGroupManager,
  Enums as ToolsEnums,
  LengthTool,
  RectangleROITool,
  EllipticalROITool,
  ArrowAnnotateTool,
  PanTool,
  EraserTool,
} from "@cornerstonejs/tools";
import { ExportImageDialog } from './ExportImageDialog';

interface ToolboxProps {}

interface ToolConfig {
  key: string;
  icon: JSX.Element;
  tooltip: string;
  action: "tool" | "invert" | "reset" | "undo" | "redo" | "viewMode" | "export";
  shortcut?: string;
  group?: "default" | "viewMode" | "export";
}

const TOOL_CONFIG: ToolConfig[] = [
  { key: "move", icon: <Move />, tooltip: "Move", action: "tool", shortcut: "V", group: "default" },
  { key: "invert", icon: <Eclipse />, tooltip: "Invert colors", action: "invert", shortcut: "I", group: "default" },
  { key: "reset", icon: <RotateCcw />, tooltip: "Reset Zoom/Position", action: "reset", shortcut: "0", group: "default" },
  { key: "length", icon: <Ruler />, tooltip: "Length measurement", action: "tool", shortcut: "L", group: "default" },
  { key: "rect", icon: <Square />, tooltip: "Rectangle ROI", action: "tool", shortcut: "R", group: "default" },
  { key: "ellipse", icon: <Circle />, tooltip: "Elliptical ROI", action: "tool", shortcut: "E", group: "default" },
  { key: "arrow", icon: <PencilLine />, tooltip: "Arrow annotation", action: "tool", shortcut: "A", group: "default" },
  { key: "eraser", icon: <Eraser />, tooltip: "Eraser", action: "tool", shortcut: "X", group: "default" },
  { key: "undo", icon: <Undo />, tooltip: "Undo", action: "undo", shortcut: "Ctrl+Z", group: "default" },
  { key: "redo", icon: <Redo />, tooltip: "Redo", action: "redo", shortcut: "Ctrl+Y", group: "default" },

  // --- View Mode Tools ---
  { key: "single", icon: <Square />, tooltip: "Regular view", action: "viewMode", shortcut: "1", group: "viewMode" },
  { key: "dual-comparison", icon: <Columns2 />, tooltip: "Side-by-Side comparison", action: "viewMode", shortcut: "2", group: "viewMode" },
  { key: "quad-comparison", icon: <Grid2X2 />, tooltip: "2x2 comparison", action: "viewMode", shortcut: "4", group: "viewMode" },

  { key: 'ctrl+s', icon: <Save />, tooltip: 'Export', action: 'export', shortcut: 'Ctrl+S', group: 'export' },
];

const Toolbox: FC<ToolboxProps> = () => {
  const {
    renderingEngine,
    renderedImageId,
    tool,
    setTool,
    viewMode,
    setViewMode,
  } = useViewerStore();

  const { DefaultHistoryMemo } = csUtils.HistoryMemo;
  const [invert, setInvert] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 🔒 Ignore shortcuts when typing in inputs or textareas
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.getAttribute("contenteditable") === "true";

      if (isTyping) return; // don't block typing

      if (!renderedImageId) return;

      const parts: string[] = [];
      if (event.ctrlKey || event.metaKey) parts.push('ctrl');
      parts.push(event.key.toLowerCase());
      const combo = parts.join('+');

      const shortcut = TOOL_CONFIG.find(
        (t) => t.shortcut?.toLowerCase() === combo
      );
      if (!shortcut) return;

      event.preventDefault();
      handleToolAction(shortcut.action, shortcut.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [renderedImageId, renderingEngine, invert, tool, viewMode]);

  const onInvert = () => {
    if (!renderedImageId) return;

    const newInvert = !invert;
    setInvert(newInvert);

    if (!renderingEngine) {
      console.error("Rendering engine not found");
      return;
    }

    const viewports = renderingEngine.getViewports() as Types.IStackViewport[];
    viewports.forEach((viewport) => {
      viewport.setProperties({ invert: newInvert });
      viewport.render();
    });
  };

  const onReset = () => {
    if (!renderedImageId || !renderingEngine) {
      console.error("Rendering engine not found or no image rendered");
      return;
    }

    const viewports = renderingEngine.getViewports() as Types.IStackViewport[];
    viewports.forEach((viewport) => {
      viewport.resetCamera();
      viewport.resetProperties();
      viewport.render();
    });
  };

  const onChangeViewMode = (mode: 'single' | 'dual-comparison' | 'quad-comparison') => {
    if (!renderedImageId) return;
    setViewMode(mode);
  };

  const onChangeTool = (selectedTool: string) => {
    if (!renderedImageId || !renderingEngine) return;
    setTool(selectedTool);

    const viewports = renderingEngine.getViewports() as Types.IStackViewport[];
    viewports.forEach((viewport) => {
      const toolGroupId = `toolgroup-${viewport.id}`;
      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      if (!toolGroup) return;

      // Deactivate all tools
      [
        PanTool,
        LengthTool,
        RectangleROITool,
        EllipticalROITool,
        ArrowAnnotateTool,
        EraserTool,
      ].forEach((t) => toolGroup.setToolPassive(t.toolName));

      const binding = { bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }] };

      switch (selectedTool) {
        case "move":
          toolGroup.setToolActive(PanTool.toolName, binding);
          break;
        case "length":
          toolGroup.setToolActive(LengthTool.toolName, binding);
          break;
        case "rect":
          toolGroup.setToolActive(RectangleROITool.toolName, binding);
          break;
        case "ellipse":
          toolGroup.setToolActive(EllipticalROITool.toolName, binding);
          break;
        case "arrow":
          toolGroup.setToolActive(ArrowAnnotateTool.toolName, binding);
          break;
        case "eraser":
          toolGroup.setToolActive(EraserTool.toolName, binding);
          break;
      }
    });
  };

  const onUndo = () => {
    if (!renderedImageId || !renderingEngine) return;
    DefaultHistoryMemo.undo();
  };

  const onRedo = () => {
    if (!renderedImageId || !renderingEngine) return;
    DefaultHistoryMemo.redo();
  };

  const handleToolAction = (action: ToolConfig["action"], key: string) => {
    switch (action) {
      case "tool":
        onChangeTool(key);
        break;
      case "invert":
        onInvert();
        break;
      case "reset":
        onReset();
        break;
      case "undo":
        onUndo();
        break;
      case "redo":
        onRedo();
        break;
      case "viewMode":
        onChangeViewMode(key as any);
        break;
      case "export":
        setExportDialogOpen(true);
        break;
    }
  };

  const defaultTools = TOOL_CONFIG.filter((t) => t.group === "default");
  const viewModeTools = TOOL_CONFIG.filter((t) => t.group === "viewMode");

  return (
    <div className="flex gap-x-1 bg-gray-300 rounded-lg p-1">
      {/* --- 🧰 Primary Tools --- */}
      {defaultTools.map(({ key, icon, tooltip, action, shortcut }) => (
        <ToolIcon
          key={key}
          icon={icon}
          tooltip={tooltip}
          shortcut={shortcut}
          toggled={
            action === "tool"
              ? tool === key
              : action === "invert"
              ? invert
              : action === "viewMode"
              ? viewMode === key
              : false
          }
          onToggle={() => handleToolAction(action, key)}
          disabled={!renderedImageId}
        />
      ))}

      {/* --- 🖼️ View Mode Popover --- */}
      <Popover>
        <PopoverTrigger>
          <ToolIcon
            icon={<SquareSplitHorizontal />}
            tooltip="Comparison Mode"
            toggled={viewMode !== 'single'}
            disabled={!renderedImageId}
          />
        </PopoverTrigger>
        <PopoverContent className="w-min">
          <div className="flex">
            {viewModeTools.map(({ key, icon, tooltip, shortcut }) => (
              <ToolIcon
                key={key}
                icon={icon}
                tooltip={tooltip}
                shortcut={shortcut}
                toggled={viewMode === key}
                onToggle={() => onChangeViewMode(key as any)}
                disabled={!renderedImageId}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* --- 💾 Export Tool --- */}
      <ToolIcon
        icon={<Save />}
        tooltip="Export"
        onToggle={() => setExportDialogOpen(true)}
        toggled={false}
        shortcut={TOOL_CONFIG.find(t => t.action === 'export')?.shortcut}
        disabled={!renderedImageId}
      />

      <ExportImageDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        renderingEngine={renderingEngine}
        renderedImageId={renderedImageId}
      />
    </div>
  );
};

interface ToolIconProps {
  icon: React.ReactNode;
  toggled: boolean;
  onToggle?: () => void;
  tooltip: string;
  shortcut?: string;
  disabled?: boolean;
}

const ToolIcon = ({
  icon,
  toggled,
  onToggle,
  tooltip,
  shortcut,
  disabled,
}: ToolIconProps) => {
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
        <p>
          {tooltip}
          {shortcut ? (
            <span className="text-xs text-gray-400 ml-1">
              ({shortcut})
            </span>
          ) : null}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default Toolbox;
