/**
 * Profile DTOs - Data Transfer Objects for user profiles
 */

export namespace ProfileDTO {
  export interface UpdateRequest {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    profilePhoto?: string; // Base64 or URL
    bio?: string;
    emergencyContact?: string;
    emergencyContactPhone?: string;
  }

  export interface Response {
    id: number;
    userId: number;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    profilePhoto?: string;
    bio?: string;
    emergencyContact?: string;
    emergencyContactPhone?: string;
    createdAt: Date;
    updatedAt?: Date;
  }
}
