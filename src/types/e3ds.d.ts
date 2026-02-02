/**
 * Eagle 3D Streaming - Tipos básicos
 * Tipos simples para la comunicación iframe con E3DS
 */

/**
 * Comando enviado desde el iframe al servidor E3DS
 */
export interface E3DSCommand {
  cmd: string;
  value?: any;
  [key: string]: any;
}

/**
 * Estructura de respuesta del servidor E3DS
 */
export interface E3DSResponse {
  type: string;
  descriptor?: any;
  [key: string]: any;
}

/**
 * Estados del ciclo de vida del iframe
 * Reference: https://docs.eagle3dstreaming.com/wiki/iframe-stages
 */
export type E3DSStage =
  | "stage1_inqueued"
  | "stage2_deQueued"
  | "stage3_slotOccupied"
  | "stage4_playBtnShowedUp"
  | "stage5_playBtnPressed"
  | "sessionExpired"
  | "videoStreamFailed";
