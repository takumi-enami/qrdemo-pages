import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { QRCodeCanvas } from "qrcode.react";

type QrRenderOptions = {
  size: number;
  margin: number;
};

type QrCanvasProps = {
  value: string;
  options: QrRenderOptions;
  onReady: (canvas: HTMLCanvasElement | null) => void;
};

function QrCanvas({ value, options, onReady }: QrCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onReady(canvasRef.current);
  }, [onReady, value]);

  return <QRCodeCanvas value={value} size={options.size} marginSize={options.margin} ref={canvasRef} />;
}

function createHiddenContainer(size: number): HTMLDivElement {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = `${size}px`;
  container.style.height = `${size}px`;
  container.style.opacity = "0";
  document.body.appendChild(container);
  return container;
}

export async function renderQrPngBlob(
  value: string,
  options: QrRenderOptions = { size: 240, margin: 0 }
): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("QR rendering requires a browser environment.");
  }

  return new Promise((resolve, reject) => {
    const container = createHiddenContainer(options.size);
    const root = createRoot(container);

    const cleanup = () => {
      setTimeout(() => {
        root.unmount();
        container.remove();
      }, 0);
    };

    const handleReady = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      canvas.toBlob(
        (blob) => {
          if (blob) {
            cleanup();
            resolve(blob);
            return;
          }
          const dataUrl = canvas.toDataURL("image/png");
          fetch(dataUrl)
            .then((res) => res.blob())
            .then((fallbackBlob) => {
              cleanup();
              resolve(fallbackBlob);
            })
            .catch((err) => {
              cleanup();
              reject(err);
            });
        },
        "image/png",
        1
      );
    };

    root.render(<QrCanvas value={value} options={options} onReady={handleReady} />);
  });
}
