/**
 * ProfileService - Business logic for user profile operations
 */

import { UserProfile } from '../types/profile';

export interface IProfileService {
  getUserProfile(userId: number): Promise<UserProfile | null>;
  updateProfile(userId: number, data: Partial<UserProfile>): Promise<UserProfile>;
}

export class ProfileService implements IProfileService {
  async getUserProfile(userId: number): Promise<UserProfile | null> {
    // TODO: Implement when ProfileRepository is created
    // const profile = await profileRepository.findByUserId(userId);
    // return profile;
    return null;
  }

  async updateProfile(userId: number, data: Partial<UserProfile>): Promise<UserProfile> {
    // TODO: Implement when ProfileRepository is created
    // const profile = await profileRepository.update(userId, data);
    // return profile;
    throw new Error('Not implemented');
  }
}

export const profileService = new ProfileService();
