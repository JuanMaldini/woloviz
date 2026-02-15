/**
 * E3DS Messaging Utilities
 * Simple iframe-based communication with Eagle 3D Streaming
 * Reference: https://docs.eagle3dstreaming.com/wiki/react-iframe-demo
 */

interface E3DSCommand {
  cmd: string;
  value?: any;
  [key: string]: any;
}

/**
 * Send a command from the webpage to the Unreal Engine via iframe
 * @param command Command object to send
 * @param targetOrigin Target origin for security (default: "*")
 */
export function sendToUE(command: E3DSCommand, targetOrigin = "*"): void {
  try {
    const iframeElement = document.getElementById(
      "iframe_1",
    ) as HTMLIFrameElement;

    if (!iframeElement || !iframeElement.contentWindow) {
      console.warn("[E3DS] iframe no encontrado o no cargado");
      return;
    }

    const payload =
      typeof command === "string" ? command : JSON.stringify(command);
    iframeElement.contentWindow.postMessage(payload, targetOrigin);

    console.log("[E3DS] Comando enviado:", command);
  } catch (error) {
    console.error("[E3DS] Error al enviar comando:", error);
  }
}

/**
 * Ejecuta una acción estándar (teleport, cambio de estado, etc.)
 * @param action Nombre de la acción
 * @param value Valor o parámetro
 */
export function executeAction(action: string, value: any): void {
  const command: E3DSCommand = {
    cmd: "ueapp04",
    value: {
      [action]: value,
    },
  };
  sendToUE(command);
}

/**
 * Envía un comando de pantalla completa
 * @param enabled true para activar, false para desactivar
 */
export function toggleFullScreen(enabled: boolean): void {
  sendToUE({
    cmd: "sendToUe4",
    value: {
      FullScreen: enabled ? "On" : "Off",
    },
  });
}

/**
 * Solicita información del usuario
 */
export function getUserInfo(): void {
  sendToUE({
    cmd: "sendToUe4",
    value: {
      action: "GetUserInfo",
    },
  });
}

/**
 * Cambia la resolución del stream
 * @param width Ancho en píxeles
 * @param height Alto en píxeles
 */
export function setResolution(width: number, height: number): void {
  sendToUE({
    cmd: "freezeResolutionAt",
    x: width,
    y: height,
  });
}

/**
 * Envía un comando personalizado al motor Unreal
 * @param payload Objeto con los datos a enviar
 */
export function sendCustomCommand(payload: Record<string, any>): void {
  sendToUE({
    cmd: "sendToUe4",
    value: payload,
  });
}
