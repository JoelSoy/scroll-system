/**
 * Normaliza eventos de rueda (mouse wheel) entre navegadores.
 * Retorna pixelY consistente.
 */
export function normalizeWheel(event: any) {
  let pixelX = 0;
  let pixelY = 0;
  let pixelZ = 0;

  // Legacy
  if ("detail" in event) {
    pixelY = event.detail;
  }
  if ("wheelDelta" in event) {
    pixelY = -event.wheelDelta / 120;
  }
  if ("wheelDeltaY" in event) {
    pixelY = -event.wheelDeltaY / 120;
  }
  if ("wheelDeltaX" in event) {
    pixelX = -event.wheelDeltaX / 120;
  }

  // Modern
  // pixelX, pixelY, pixelZ normally available
  if ("deltaY" in event) {
    pixelY = event.deltaY;
  }
  if ("deltaX" in event) {
    pixelX = event.deltaX;
  }

  // Delta Mode adjustments
  // 1 = DOM_DELTA_LINE (firefox default)
  if ((event.deltaMode || 0) === 1) {
    pixelY *= 40;
    pixelX *= 40;
  }
  // 2 = DOM_DELTA_PAGE
  else if ((event.deltaMode || 0) === 2) {
    pixelY *= 800;
    pixelX *= 800;
  }

  return { pixelX, pixelY, pixelZ };
}
