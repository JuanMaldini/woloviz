/**
 * E3DS Messaging Utilities
 * Simple iframe-based communication with Eagle 3D Streaming
 * Reference: https://docs.eagle3dstreaming.com/wiki/react-iframe-demo
 */

/**
 * Send a command from the webpage to the Unreal Engine via iframe
 * @param {object|string} command Command object to send
 * @param {string} targetOrigin Target origin for security (default: "*")
 */
export function sendToUE(command, targetOrigin = "*") {
  try {
    const iframeElement = document.getElementById("iframe_1");

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
 * @param {string} action Nombre de la acción
 * @param {any} value Valor o parámetro
 */
export function executeAction(action, value) {
  const command = {
    cmd: "ueapp04",
    value: {
      [action]: value,
    },
  };
  sendToUE(command);
}

/**
 * Envía un comando de pantalla completa
 * @param {boolean} enabled true para activar, false para desactivar
 */
export function toggleFullScreen(enabled) {
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
export function getUserInfo() {
  sendToUE({
    cmd: "sendToUe4",
    value: {
      action: "GetUserInfo",
    },
  });
}

/**
 * Cambia la resolución del stream
 * @param {number} width Ancho en píxeles
 * @param {number} height Alto en píxeles
 */
export function setResolution(width, height) {
  sendToUE({
    cmd: "freezeResolutionAt",
    x: width,
    y: height,
  });
}

/**
 * Envía un comando personalizado al motor Unreal
 * @param {Record<string, any>} payload Objeto con los datos a enviar
 */
export function sendCustomCommand(payload) {
  sendToUE({
    cmd: "sendToUe4",
    value: payload,
  });
}
