export const PERMISOS = {
  LUGARES_LEER: 'lugares:leer',
  LUGARES_ADMINISTRAR: 'lugares:administrar',
  RUTAS_ADMINISTRAR: 'rutas:administrar',
  RECORRIDOS_PROPIOS: 'recorridos:propios',
  ESTADISTICAS_PROPIAS: 'estadisticas:propias',
  ESTADISTICAS_TODAS: 'estadisticas:todas',
  SELLOS_CODIGO: 'sellos:codigo',
  RECOMPENSAS_CANJEAR: 'recompensas:canjear',
  USUARIOS_ROLES: 'usuarios:roles',
} as const;

export type Permiso = (typeof PERMISOS)[keyof typeof PERMISOS];
