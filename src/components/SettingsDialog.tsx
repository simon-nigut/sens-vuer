"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSave = () => {
    console.log("Saved settings:", {
      username,
      notificationsEnabled,
      theme,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Display name</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name..."
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Enable notifications</Label>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={(checked) => setNotificationsEnabled(checked)}
            />
          </div>

          {/* Theme Selection */}
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex items-center gap-x-2">
              {(["light", "dark", "system"] as const).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant={theme === mode ? "default" : "outline"}
                  onClick={() => setTheme(mode)}
                  className="capitalize"
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-x-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
