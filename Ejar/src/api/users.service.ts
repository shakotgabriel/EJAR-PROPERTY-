import API from "./api";

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

class UsersService {
  /**
   * Update user profile (name, email, etc.)
   */
  async updateProfile(data: UpdateProfileData): Promise<unknown> {
    try {
      const res = await API.patch("users/me/", data);
      return res.data;
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<{ detail: string }> {
    try {
      const res = await API.post<{ detail: string }>("users/change-password/", {
        old_password: data.old_password,
        new_password: data.new_password,
        new_password_confirm: data.new_password_confirm,
      });
      return res.data;
    } catch (error) {
      console.error("Failed to change password:", error);
      throw error;
    }
  }
}

export default new UsersService();
