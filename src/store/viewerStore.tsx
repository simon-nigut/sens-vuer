import { getRenderingEngine, type Types } from "@cornerstonejs/core";
import { create } from "zustand";

interface ViewerState {
  renderingEngineId: string;
  stackViewportId: string;
  renderedImageId: string | null;
  tool: string | null;
  isLoading: boolean;
  stack: string[]; // track the current stack

  setRenderedImageId: (id: string) => void;
  setTool: (tool: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setStack: (stack: string[]) => void;

  renderImage: (imageId: string) => Promise<void>;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  renderingEngineId: "sens-vuer_rendering-engine",
  stackViewportId: "COLOR_STACK",
  renderedImageId: null,
  tool: null,
  isLoading: false,
  stack: [],

  setRenderedImageId: (imageId) => set({ renderedImageId: imageId }),
  setTool: (tool) => set({ tool }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setStack: (stack) => set({ stack }),

  renderImage: async (imageId: string) => {
    const { renderingEngineId, stackViewportId, setRenderedImageId, setIsLoading, stack } = get();

    const renderingEngine = getRenderingEngine(renderingEngineId);
    if (!renderingEngine) return;

    const viewport = renderingEngine.getViewport(stackViewportId) as Types.IStackViewport;
    if (!viewport) return;

    try {
      setIsLoading(true);

      // Find index in existing stack
      const index = stack.findIndex((id) => id === imageId);

      if (index !== -1 && viewport.setImageIdIndex) {
        viewport.setImageIdIndex(index); // select from existing stack
      } else if (viewport.setStack) {
        await viewport.setStack([imageId]); // new stack
        set({ stack: [imageId] }); // update store
      }

      viewport.resetCamera?.();
      viewport.resetProperties?.();
      viewport.render();

      setRenderedImageId(imageId);
    } finally {
      setIsLoading(false);
    }
  },
}));
