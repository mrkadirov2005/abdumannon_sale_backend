import type { Permission } from "../../types/types";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../config/endpoints";

export interface ComingPermissionResponse {
  message: string;
  data: Permission[];
}

// Return type now includes error possibility
export const getAllPermissions = async (
  token: string | null
): Promise<Permission[] | number | Error> => {
  try {
    const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.permissions.all}`, {
      method: "POST",
      headers: {
        authorization: `${token}`,
      },
    });

    if (response.ok) {
      const data: ComingPermissionResponse = await response.json();
      return data.data;
    }
    return 400; // Bad request status code as number
  } catch (error) {
    if (error instanceof Error) return error;
    return new Error("Unknown error");
  }
};
