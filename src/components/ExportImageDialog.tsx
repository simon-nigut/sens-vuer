"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useViewerStore } from "@/store/viewerStore";

interface ExportImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renderingEngine: any; // You can type this as cornerstone Types.RenderingEngine
  renderedImageId: string | null;
}

export function ExportImageDialog({ open, onOpenChange, renderingEngine, renderedImageId }: ExportImageDialogProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>(() => {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    return `sensvuer-export-${ts}`;
  });
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [selectedViewport, setSelectedViewport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { viewMode } = useViewerStore();

  useEffect(() => {
    if (open) {
      generatePreview(includeAnnotations);
      const viewports = renderingEngine.getViewports();
      if (viewports.length > 0 && !selectedViewport) setSelectedViewport(viewports[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, includeAnnotations, selectedViewport]);

  const generatePreview = async (withAnnotations: boolean) => {
    if (!renderingEngine || !renderedImageId) return;
    setLoading(true);

    try {
      const viewports = renderingEngine.getViewports();
      if (!viewports?.length) throw new Error("No viewports available");

      const viewport = viewports.find((vp: any) => vp.id === selectedViewport) ?? viewports[0];
      const viewportElement = viewport.element;
      const canvas = viewportElement.querySelector("canvas") as HTMLCanvasElement;
      const svgElements = viewportElement.querySelectorAll("svg");

      if (!canvas) throw new Error("No canvas found in viewport");

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;

      const ctx = exportCanvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get 2D context");

      ctx.drawImage(canvas, 0, 0);

      if (withAnnotations && svgElements.length > 0) {
        const svgImages = await Promise.all(
          Array.from(svgElements).map(
            (svg) =>
              new Promise<HTMLImageElement>((resolve, reject) => {
                const svgElement = svg as SVGElement;
                const clone = svgElement.cloneNode(true) as SVGElement;
                const bbox = svgElement.getBoundingClientRect();
                clone.setAttribute("width", bbox.width.toString());
                clone.setAttribute("height", bbox.height.toString());

                const svgString = new XMLSerializer().serializeToString(clone);
                const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const img = new Image();

                img.onload = () => {
                  URL.revokeObjectURL(url);
                  resolve(img);
                };
                img.onerror = () => {
                  URL.revokeObjectURL(url);
                  reject(new Error("Failed to load SVG"));
                };
                img.src = url;
              })
          )
        );
        svgImages.forEach((img) => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));
      }

      const previewUrl = exportCanvas.toDataURL("image/png");
      setImagePreview(previewUrl);
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!imagePreview) return;
    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = imagePreview;
    link.click();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Export Image</DialogTitle>
        </DialogHeader>

        <div className="flex gap-x-6">

          <div className="flex justify-center">
            {loading ? (
              <p className="text-sm text-muted-foreground">Generating preview...</p>
            ) : imagePreview ? (
              <img
                src={imagePreview}
                alt="Export preview"
                className="max-w-xl rounded-md border object-contain"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No preview available</p>
            )}
          </div>

          <div className="w-full space-y-4 flex flex-col justify-between">
            <div className="space-y-4">

              {viewMode !== "single" ? (
                <div className="space-y-2">
                  <Label>Select viewport to export</Label>
                  <RadioGroup
                    value={selectedViewport ?? ""}
                    onValueChange={setSelectedViewport}
                    className="flex flex-col gap-2"
                  >
                    {renderingEngine?.getViewports()?.map((vp: any) => (
                      <div key={vp.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={vp.id} id={`viewport-${vp.id}`} />
                        <Label htmlFor={`viewport-${vp.id}`} className="capitalize">
                          {vp.id.replace(/_/g, " ")}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ) : null }

              <div className="space-y-2">
                <Label htmlFor="fileName">File name</Label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Export name..."
                />
              </div>

              <div className="flex items-center gap-x-2">
                <Switch
                  id="annotations"
                  checked={includeAnnotations}
                  onCheckedChange={(checked) => setIncludeAnnotations(checked)}
                />
                <Label htmlFor="annotations">Include annotations</Label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={!imagePreview}>
                Export
              </Button>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
