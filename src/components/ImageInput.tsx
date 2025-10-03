import { useState, type FC } from "react";
import { getRenderingEngine, type Types } from "@cornerstonejs/core";
import { Button } from "./ui/button";
import { Upload } from "lucide-react";
import { useViewerStore } from "@/store/viewerStore";

interface ImageInputProps {
  renderingEngineId: string;
  stackViewportId: string;
  onImagesAdded: (ids: string[]) => void;
}

interface ImageEntry {
  id: string;   // web:blob url
  name: string; // original filename
}

const ImageInput: FC<ImageInputProps> = ({
  renderingEngineId,
  stackViewportId,
  onImagesAdded,
}) => {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const { renderedImageId, setRenderedImageId, renderImage, setStack } = useViewerStore();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: ImageEntry[] = [];
    const newImageIds: string[] = [];

    Array.from(files).forEach((file) => {
      const objectUrl = URL.createObjectURL(file);
      const imageId = `web:${objectUrl}`;
      newImages.push({ id: imageId, name: file.name });
      newImageIds.push(imageId);
    });

    const updated = [...images, ...newImages];
    setImages(updated);
    onImagesAdded(updated.map((img) => img.id));

    // Load all new images into the stack viewport
    const renderingEngine = getRenderingEngine(renderingEngineId);
    if (!renderingEngine) return;

    const viewport = renderingEngine.getViewport(
      stackViewportId
    ) as Types.IStackViewport;

    if (!viewport) {
      console.error("Viewport not found");
      return;
    }

    // Set the stack with all images
    viewport.setStack(updated.map((img) => img.id));
    viewport.render();
    setStack(updated.map((img) => img.id));
    setRenderedImageId(newImageIds[0]);
  };

  const noImagesLoaded = images.length === 0;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ marginTop: "8px" }}>
        <ul className="grid grid-cols-2 gap-2">
          {images.map((img) => (
            <li
              key={img.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("imageId", img.id);
              }}
              onClick={() => renderImage(img.id)}
              className={`cursor-pointer py-1.5 px-1 bg-gray-200 hover:bg-gray-300 flex flex-col items-center ${
                renderedImageId === img.id ? "border-2 border-blue-500" : "border"
              }`}
            >
              <img
                src={img.id.replace("web:", "")}
                alt={img.name}
                width="160"
                className="mb-1"
              />
              <span className="text-sm">{img.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {noImagesLoaded && (
        <span className="text-center mb-4 block">
          No images loaded, select them with button below.
        </span>
      )}

      <input
        id="file-upload"
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <label htmlFor="file-upload">
        <Button asChild variant="outline" className="w-full mt-6">
          <span><Upload /> Select {!noImagesLoaded ? "more" : ""} Images</span>
        </Button>
      </label>
    </div>
  );
};

export default ImageInput;
