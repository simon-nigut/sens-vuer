import { getRenderingEngine, RenderingEngine, type Types } from "@cornerstonejs/core";
import { create } from "zustand";

interface ViewerState {
  renderingEngineId: string;
  renderingEngine: RenderingEngine | null;
  stackViewportId: string;
  renderedImageId: string | null;
  tool: string;
  isLoading: Record<string, boolean>;   // per-viewport loading
  stack: string[]; // track the current stack
  viewMode: 'single' | 'dual-comparison' | 'quad-comparison';

  setRenderingEngine: (engine: RenderingEngine) => void;
  setRenderedImageId: (id: string) => void;
  setTool: (tool: string) => void;
  setIsLoading: (viewportId: string, loading: boolean) => void;
  setStack: (stack: string[]) => void;
  setViewMode: (mode: 'single' | 'dual-comparison' | 'quad-comparison') => void;

  renderImage: (imageId: string, viewportId?: string) => Promise<void>;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  renderingEngineId: "sens-vuer_rendering-engine",
  renderingEngine: null,
  stackViewportId: "primary_viewport",
  renderedImageId: null,
  tool: "move",
  isLoading: {},
  stack: [],
  viewMode: 'single',

  setRenderingEngine: (engine) => set({ renderingEngine: engine }),
  setRenderedImageId: (imageId) => set({ renderedImageId: imageId }),
  setTool: (tool) => set({ tool }),
  setIsLoading: (viewportId, loading) =>
    set((state) => ({
      isLoading: {
        ...state.isLoading,
        [viewportId]: loading,
      },
    })),
  setStack: (stack) => set({ stack }),
  setViewMode: (mode) => set({ viewMode: mode }),

  renderImage: async (imageId: string, viewportId?: string) => {
    const { renderingEngineId, stackViewportId, setIsLoading, stack, setRenderedImageId } = get();
    const renderingEngine = getRenderingEngine(renderingEngineId);
    if (!renderingEngine) return;

    const targetViewportId = viewportId ?? stackViewportId;

    setIsLoading(targetViewportId, true);

    const viewport = renderingEngine.getViewport(
      targetViewportId
    ) as Types.IStackViewport;

    if (!viewport) {
      console.warn(`Viewport ${targetViewportId} not found`);
      setIsLoading(targetViewportId, false);
      return;
    }

    try {
      const imageIdIndex = stack.indexOf(imageId);
      await viewport.setImageIdIndex(imageIdIndex);
      viewport.render();
      setRenderedImageId(imageId);
    } catch (error) {
      console.error("Failed to render image:", error);
    } finally {
      setIsLoading(targetViewportId, false);
    }
  },
}));
