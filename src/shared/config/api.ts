// Solo contiene la URL pública. Las credenciales de la BD permanecen en el servidor.
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://proyecto-estetica-3dnx.onrender.com/api').replace(/\/+$/, '');
