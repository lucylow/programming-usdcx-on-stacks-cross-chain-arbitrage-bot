import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Bell, Shield, Palette, Globe, Wallet, LogOut, Trash2, Save } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "../components/ui/badge"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Switch } from "../components/ui/switch"
import { Label } from "../components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"

// @ts-ignore
import { useStacks } from "@lib/stacks/StacksProvider"

export default function Settings() {
  let stacksData: any = null
  
  try {
    stacksData = useStacks?.()
  } catch {}

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    trades: true,
    opportunities: true,
    errors: true
  })
  const [privacy, setPrivacy] = useState({
    shareAnalytics: false,
    publicProfile: false,
    showBalance: true
  })
  const [preferences, setPreferences] = useState({
    theme: "dark",
    language: "en",
    currency: "USD",
    slippage: "0.5"
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast.success("Settings saved successfully")
  }

  const handleDisconnect = () => {
    if (stacksData?.signOut) {
      stacksData.signOut()
      toast.success("Wallet disconnected")
    } else {
      toast.info("Wallet not connected")
    }
  }

  const wallet = stacksData?.userSession?.loadUserData?.() || {
    connected: false,
    address: null
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsla(245,100%,64%,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsla(162,100%,42%,0.08),transparent_40%)]" />
      
      <div className="pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent mb-2">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your preferences and account
            </p>
          </div>

          {/* Wallet Settings */}
          <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>Wallet</CardTitle>
              </div>
              <CardDescription>Manage your wallet connection</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {wallet.connected && wallet.address ? (
                <div className="space-y-4">
                  <div className="p-4 bg-card/50 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium mb-1">Connected Wallet</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {wallet.address}
                        </p>
                      </div>
                      <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                        Connected
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    className="w-full gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect Wallet
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No wallet connected</p>
                  <Button className="gap-2">
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Control how you receive updates</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Trade Executions</Label>
                  <p className="text-sm text-muted-foreground">Notify on completed trades</p>
                </div>
                <Switch
                  checked={notifications.trades}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, trades: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Arbitrage Opportunities</Label>
                  <p className="text-sm text-muted-foreground">Alert on new opportunities</p>
                </div>
                <Switch
                  checked={notifications.opportunities}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, opportunities: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Error Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify on errors</p>
                </div>
                <Switch
                  checked={notifications.errors}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, errors: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>Preferences</CardTitle>
              </div>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(value) => setPreferences({ ...preferences, theme: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={preferences.language}
                  onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={preferences.currency}
                  onValueChange={(value) => setPreferences({ ...preferences, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Slippage Tolerance (%)</Label>
                <Select
                  value={preferences.slippage}
                  onValueChange={(value) => setPreferences({ ...preferences, slippage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.1">0.1%</SelectItem>
                    <SelectItem value="0.5">0.5%</SelectItem>
                    <SelectItem value="1.0">1.0%</SelectItem>
                    <SelectItem value="3.0">3.0%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className="bg-dark/60 border-white/10 backdrop-blur-xl mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand" />
                <CardTitle>Privacy</CardTitle>
              </div>
              <CardDescription>Control your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Share Analytics</Label>
                  <p className="text-sm text-muted-foreground">Help improve the platform</p>
                </div>
                <Switch
                  checked={privacy.shareAnalytics}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, shareAnalytics: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-muted-foreground">Make your profile visible</p>
                </div>
                <Switch
                  checked={privacy.publicProfile}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, publicProfile: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Balance</Label>
                  <p className="text-sm text-muted-foreground">Display balances in portfolio</p>
                </div>
                <Switch
                  checked={privacy.showBalance}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, showBalance: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-dark/60 border-error/30 backdrop-blur-xl mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-error" />
                <CardTitle className="text-error">Danger Zone</CardTitle>
              </div>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-darker/60 rounded-lg border border-error/20">
                <p className="text-sm font-medium mb-2">Clear All Data</p>
                <p className="text-xs text-muted-foreground mb-4">
                  This will delete all your local preferences and cache. This action cannot be undone.
                </p>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 min-w-32"
            >
              {isSaving ? (
                <>
                  <Save className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
