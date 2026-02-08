import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import usersService from "@/api/users.service";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

const Profile: React.FC = () => {
  const { user, reloadUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

 
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  
  useEffect(() => {
    if (nameMessage) {
      const timer = setTimeout(() => setNameMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [nameMessage]);

  useEffect(() => {
    if (passwordMessage) {
      const timer = setTimeout(() => setPasswordMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordMessage]);

  useEffect(() => {
    if (!isEditingName) {
      setFirstName(user?.first_name || "");
      setLastName(user?.last_name || "");
    }
  }, [user?.first_name, user?.last_name, isEditingName]);

  const handleSaveName = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setNameMessage({ type: "error", text: "First name and last name are required" });
      return;
    }

    setNameSaving(true);
    setNameMessage(null);

    try {
      await usersService.updateProfile({ first_name: firstName, last_name: lastName });
      setNameMessage({ type: "success", text: "Name updated successfully" });
      setIsEditingName(false);
      
      
      if (reloadUser) {
        await reloadUser();
      }
    } catch (error) {
      const responseData = (error as { response?: { data?: { detail?: string; first_name?: string[] } } })
        ?.response?.data;
      setNameMessage({
        type: "error",
        text: responseData?.detail || responseData?.first_name?.[0] || "Failed to update name",
      });
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "All fields are required" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setPasswordSaving(true);
    setPasswordMessage(null);

    try {
      await usersService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      setPasswordMessage({ type: "success", text: "Password changed successfully" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (error) {
      const responseData = (error as { response?: { data?: { old_password?: string[]; detail?: string } } })
        ?.response?.data;
      setPasswordMessage({
        type: "error",
        text:
          responseData?.old_password?.[0] ||
          responseData?.detail ||
          "Failed to change password",
      });
    } finally {
      setPasswordSaving(false);
    }
  };


  const getPasswordStrength = (pwd: string) => {
    if (pwd.length >= 12) return "Strong";
    if (pwd.length >= 8) return "Medium";
    return "Weak";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
    
        <Card className="rounded-3xl shadow-2xl border border-white/50 backdrop-blur bg-white/90">
          <CardContent className="py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold">
                    {(user?.first_name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {user ? `${user.first_name} ${user.last_name}`.trim() : "Your Account"}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              {user?.role && (
                <Badge variant="secondary" className="capitalize">
                  {user.role}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>


        <Card className="rounded-3xl shadow-2xl border border-white/50 backdrop-blur bg-white/90 transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Profile Settings
            </CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
        
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">{user?.email}</div>
            </div>

            <Separator />

     
            {!isEditingName ? (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">{firstName}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">{lastName}</div>
                  </div>
                </div>
                <Button
                  onClick={() => setIsEditingName(true)}
                  className="mt-8 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Edit Name
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200 transition-all duration-300">
                <div>
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Enter first name" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Enter last name" className="mt-1" />
                </div>

                {nameMessage && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm transition-opacity duration-500 ${
                      nameMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {nameMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {nameMessage.text}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleSaveName} disabled={nameSaving} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    {nameSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditingName(false);
                      setFirstName(user?.first_name || "");
                      setLastName(user?.last_name || "");
                      setNameMessage(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

    
        <Card className="rounded-3xl shadow-2xl border border-white/50 backdrop-blur bg-white/90 transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-gray-800">Security</CardTitle>
            <CardDescription>Change your password to keep your account secure</CardDescription>
          </CardHeader>

          <CardContent>
            {!isChangingPassword ? (
              <Button onClick={() => setIsChangingPassword(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                Change Password
              </Button>
            ) : (
              <div className="space-y-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200 transition-all duration-300">
            
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Password</label>
                  <div className="relative mt-1">
                    <Input type={showPasswords.old ? "text" : "password"} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter current password" />
                    <button
                      aria-label={showPasswords.old ? "Hide current password" : "Show current password"}
                      onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

            
                <div>
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <div className="relative mt-1">
                    <Input type={showPasswords.new ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 8 characters)" />
                    <button
                      aria-label={showPasswords.new ? "Hide new password" : "Show new password"}
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && <p className="text-xs mt-1 text-gray-500">Strength: {getPasswordStrength(newPassword)}</p>}
                </div>

             
                <div>
                  <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                  <div className="relative mt-1">
                    <Input type={showPasswords.confirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                    <button
                      aria-label={showPasswords.confirm ? "Hide confirm password" : "Show confirm password"}
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {passwordMessage && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm transition-opacity duration-500 ${
                      passwordMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {passwordMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {passwordMessage.text}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleChangePassword} disabled={passwordSaving} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    {passwordSaving ? "Changing..." : "Change Password"}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setOldPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordMessage(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
