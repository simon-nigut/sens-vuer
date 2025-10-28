import { type Types, utilities as csUtils } from '@cornerstonejs/core';
import {
  SquareSplitHorizontal,
  Columns2,
  Square,
  Ruler,
  Circle,
  Move,
  Eraser,
  Save,
  Settings,
  Sun,
  LocateFixed,
  Undo2,
  Redo2,
  MoveUpLeft,
} from 'lucide-react';
import { useEffect, useState, type FC, type JSX } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useViewerStore } from "@/store/viewerStore";
import {
  ToolGroupManager,
  Enums as ToolsEnums,
  LengthTool,
  RectangleROITool,
  EllipticalROITool,
  ArrowAnnotateTool,
  PanTool,
  EraserTool,
  WindowLevelTool,
} from "@cornerstonejs/tools";
import { ExportImageDialog } from './ExportImageDialog';
import { SettingsDialog } from './SettingsDialog';
import { Separator } from './ui/separator';

interface ToolboxProps {}

interface ToolConfig {
  key: string;
  icon: JSX.Element;
  tooltip: string;
  action: "tool" | "reset" | "undo" | "redo" | "viewMode" | "export" | "settings";
  shortcut?: string;
  group?: "default" | "annotation" | "viewMode" | "misc";
}

const TOOL_CONFIG: ToolConfig[] = [
  { key: "move", icon: <Move size={18} />, tooltip: "Move", action: "tool", shortcut: "V", group: "default" },
  { key: "contrast", icon: <Sun size={18} />, tooltip: "Adjust contrast (Window/Level)", action: "tool", shortcut: "C", group: "default" },
  { key: "center", icon: <LocateFixed size={18} />, tooltip: "Reset pan/zoom", action: "reset", shortcut: "0", group: "default" },

  { key: "length", icon: <Ruler size={18} />, tooltip: "Length measurement", action: "tool", shortcut: "L", group: "annotation" },
  { key: "rect", icon: <Square size={18} />, tooltip: "Rectangle ROI", action: "tool", shortcut: "R", group: "annotation" },
  { key: "ellipse", icon: <Circle size={18} />, tooltip: "Elliptical ROI", action: "tool", shortcut: "E", group: "annotation" },
  { key: "arrow", icon: <MoveUpLeft size={18} />, tooltip: "Arrow annotation", action: "tool", shortcut: "A", group: "annotation" },
  { key: "eraser", icon: <Eraser size={18} />, tooltip: "Eraser", action: "tool", shortcut: "X", group: "annotation" },
  { key: "undo", icon: <Undo2 size={18} />, tooltip: "Undo", action: "undo", shortcut: "Ctrl+Z", group: "annotation" },
  { key: "redo", icon: <Redo2 size={18} />, tooltip: "Redo", action: "redo", shortcut: "Ctrl+Y", group: "annotation" },

  // --- View Mode Tools ---
  { key: "single", icon: <Square size={18} />, tooltip: "Regular view", action: "viewMode", shortcut: "1", group: "viewMode" },
  { key: "dual-comparison", icon: <Columns2 size={18} />, tooltip: "Side-by-Side comparison", action: "viewMode", shortcut: "2", group: "viewMode" },

  { key: 'export', icon: <Save size={18} />, tooltip: 'Export', action: 'export', shortcut: 'Ctrl+S', group: 'misc' },
  { key: 'settings', icon: <Settings size={18} />, tooltip: 'Settings', action: 'settings', shortcut: '', group: 'misc' },
];

const Toolbox: FC<ToolboxProps> = () => {
  const {
    renderingEngine,
    renderedImageIds,
    tool,
    setTool,
    viewMode,
    setViewMode,
  } = useViewerStore();

  const { DefaultHistoryMemo } = csUtils.HistoryMemo;
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 🔒 Ignore shortcuts when typing in inputs or textareas
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.getAttribute("contenteditable") === "true";

      if (isTyping) return; // don't block typing

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
  }, [renderingEngine, tool, viewMode]);

  const onReset = () => {
    if (!renderingEngine) {
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

  const onChangeViewMode = (mode: 'single' | 'dual-comparison') => {
    if (!renderingEngine) return;
    setViewMode(mode);
  };

  const onChangeTool = (selectedTool: string) => {
    if (!renderingEngine) return;
    setTool(selectedTool);

    const viewports = renderingEngine.getViewports() as Types.IStackViewport[];
    viewports.forEach((viewport) => {
      const toolGroupId = `toolgroup-${viewport.id}`;
      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      if (!toolGroup) return;

      // Deactivate all tools
      [
        PanTool,
        WindowLevelTool,
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
        case "contrast":
          toolGroup.setToolActive(WindowLevelTool.toolName, binding);
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
    if (!renderingEngine) return;
    DefaultHistoryMemo.undo();
  };

  const onRedo = () => {
    if (!renderingEngine) return;
    DefaultHistoryMemo.redo();
  };

  const handleToolAction = (action: ToolConfig["action"], key: string) => {
    switch (action) {
      case "tool":
        onChangeTool(key);
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
      case "settings":
        setSettingsDialogOpen(true);
        break;
    }
  };

  const defaultTools = TOOL_CONFIG.filter((t) => t.group === "default");
  const annotationTools = TOOL_CONFIG.filter((t) => t.group === "annotation");
  const miscTools = TOOL_CONFIG.filter((t) => t.group === "misc")

  const noImageRendered = Object.keys(renderedImageIds).length === 0;

  return (
    <div className="flex gap-x-1 rounded-lg">
      {/* --- 🧰 Primary Tools --- */}
      {defaultTools.map(({ key, icon, tooltip, action, shortcut }) => (
        <ToolIcon
          name={key}
          icon={icon}
          tooltip={tooltip}
          shortcut={shortcut}
          toggled={
            action === "tool"
              ? tool === key
              : action === "viewMode"
              ? viewMode === key
              : false
          }
          onToggle={() => handleToolAction(action, key)}
          disabled={noImageRendered}
        />
      ))}

      <Separator orientation="vertical" className="mx-2" />

      {/* --- Annotation Tools --- */}
      {annotationTools.map(({ key, icon, tooltip, action, shortcut }) => (
        <ToolIcon
          name={key}
          icon={icon}
          tooltip={tooltip}
          shortcut={shortcut}
          toggled={tool === key}
          onToggle={() => handleToolAction(action, key)}
          disabled={noImageRendered}
        />
      ))}

      <Separator orientation="vertical" className="mx-2" />

      {/* --- 🖼️ Comparison Toggle --- */}
      <ToolIcon
        name="Compare"
        icon={<SquareSplitHorizontal size={18} />}
        tooltip="Toggle Dual Comparison"
        toggled={viewMode === 'dual-comparison'}
        onToggle={() => onChangeViewMode(viewMode === 'single' ? 'dual-comparison' : 'single')}
        disabled={noImageRendered}
      />

      {/* --- 💾 Misc Tools --- */}
      {miscTools.map(({ key, icon, tooltip, action, shortcut }) => (
        <ToolIcon
          name={key}
          icon={icon}
          tooltip={tooltip}
          shortcut={shortcut}
          toggled={false}
          onToggle={() => handleToolAction(action, key)}
          disabled={noImageRendered}
        />
      ))}

      <ExportImageDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        renderingEngine={renderingEngine}
        renderedImageId={renderedImageIds['primary_viewport']}
      />

      <SettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} />
    </div>
  );
};

interface ToolIconProps {
  name: string;
  icon: React.ReactNode;
  toggled: boolean;
  onToggle?: () => void;
  tooltip: string;
  shortcut?: string;
  disabled?: boolean;
}

const ToolIcon = ({
  name,
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
          className={`rounded-lg p-2 cursor-pointer flex flex-col items-center space-y-0.5 transition ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : toggled
              ? "bg-primary text-white hover:bg-primary/90"
              : "hover:bg-background-300"
          }`}
          onClick={onToggle}
        >
          {icon}
          <span className="text-xs capitalize">{name}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="bg-secondary">
        <p className="text-foreground">
          {tooltip}
          {shortcut ? (
            <span className="text-xs text-muted-foreground ml-1">
              ({shortcut})
            </span>
          ) : null}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default Toolbox;
