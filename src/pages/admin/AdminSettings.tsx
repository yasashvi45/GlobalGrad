import React, { useState, useEffect } from "react";
import {
  Save,
  Image as ImageIcon,
  Globe,
  Mail,
  Bell,
  Database,
  PenTool,
  LayoutTemplate,
  Lock,
  HardDrive,
  Download,
  UploadCloud,
  Check,
} from "lucide-react";
import { motion } from "motion/react";
import { getTable, saveToTable } from "@/lib/api";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>({
    platformName: "GlobalGrad",
    supportEmail: "support@globalgrad.com",
    platformDescription:
      "GlobalGrad is a premium platform for international students to find the best universities and scholarships.",
    timezone: "UTC",
    defaultCurrency: "USD",
    defaultLanguage: "English",
    primaryColor: "#4F46E5",
    secondaryColor: "#EC4899",
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
    senderName: "GlobalGrad",
    senderEmail: "noreply@globalgrad.com",
    emailNotifications: true,
    adminAlerts: true,
    userRegistrationAlerts: true,
    applicationAlerts: true,
    marketingEmails: false,
    storageProvider: "Firebase",
    imageUploadLimits: "5MB",
    documentUploadLimits: "10MB",
    enable2FA: false,
    passwordPolicy: "Strong",
    sessionTimeout: "24 Hours",
    loginAttempts: "5",
    adminAccessControls: "Strict",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = (await getTable("settings")) || [];
      if (data && data.length > 0) {
        setSettings({ ...settings, ...data[0] });
        setDocumentId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (documentId) {
        await saveToTable("settings", { ...settings, id: documentId });
      } else {
        const newSettings = await saveToTable("settings", settings);
        if (newSettings && newSettings.id) setDocumentId(newSettings.id);
      }

      // Generate a notification for settings update
      await saveToTable("admin_notifications", {
        title: "Settings Updated",
        description:
          "Platform configuration settings were updated by the administrator.",
        type: "System",
        read: false,
        status: "New",
        createdAt: new Date(),
      });

      window.dispatchEvent(
        new CustomEvent("app_toast", {
          detail: { message: "Settings saved successfully" },
        }),
      );
    } catch (e) {
      console.error(e);
      window.dispatchEvent(
        new CustomEvent("app_toast", {
          detail: { message: "Failed to save settings", type: "error" },
        }),
      );
    }
  };

  const handleCreateBackup = () => {
    window.dispatchEvent(
      new CustomEvent("app_toast", {
        detail: { message: "Database backup initiated" },
      }),
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Platform Settings
          </h1>
          <p className="text-slate-500 font-medium">
            Manage global platform configurations and preferences.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20 w-full sm:w-auto"
        >
          <Save className="w-5 h-5" /> Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1 space-y-2 sticky top-8">
          {[
            { id: "general", icon: Globe, label: "General" },
            { id: "branding", icon: PenTool, label: "Branding" },
            { id: "email", icon: Mail, label: "Email Server" },
            { id: "notifications", icon: Bell, label: "Notifications" },
            { id: "storage", icon: HardDrive, label: "Storage" },
            { id: "security", icon: Lock, label: "Security" },
            { id: "backup", icon: Database, label: "Backup & Restore" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-8"
          >
            {activeTab === "general" && (
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Globe className="w-6 h-6 text-indigo-600" /> General
                  Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={settings.platformName}
                      onChange={(e) =>
                        handleChange("platformName", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      Platform Description
                    </label>
                    <textarea
                      rows={3}
                      value={settings.platformDescription}
                      onChange={(e) =>
                        handleChange("platformDescription", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) =>
                        handleChange("supportEmail", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleChange("timezone", e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    >
                      <option value="UTC">UTC (GMT+0)</option>
                      <option value="EST">EST (GMT-5)</option>
                      <option value="PST">PST (GMT-8)</option>
                      <option value="IST">IST (GMT+5:30)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      Default Currency
                    </label>
                    <select
                      value={settings.defaultCurrency}
                      onChange={(e) =>
                        handleChange("defaultCurrency", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      Default Language
                    </label>
                    <select
                      value={settings.defaultLanguage}
                      onChange={(e) =>
                        handleChange("defaultLanguage", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Mandarin">Mandarin</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "branding" && (
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <PenTool className="w-6 h-6 text-indigo-600" /> Branding &
                  Aesthetics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-bold text-slate-900 mb-2 block">
                        Logo Upload
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <div>
                          <button className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors mb-2 text-sm z-[1]">
                            Choose File
                          </button>
                          <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
                            PNG or SVG. 256x256px max.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-900 mb-2 block">
                        Favicon Upload
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400">
                          <LayoutTemplate className="w-6 h-6" />
                        </div>
                        <div>
                          <button className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors mb-2 text-sm z-[1]">
                            Choose File
                          </button>
                          <p className="text-xs text-slate-500 font-medium">
                            ICO or PNG. 32x32px.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-bold text-slate-900 mb-2 block">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl shadow-inner border border-slate-200"
                          style={{ backgroundColor: settings.primaryColor }}
                        ></div>
                        <input
                          type="text"
                          value={settings.primaryColor}
                          onChange={(e) =>
                            handleChange("primaryColor", e.target.value)
                          }
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 uppercase font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-900 mb-2 block">
                        Secondary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl shadow-inner border border-slate-200"
                          style={{ backgroundColor: settings.secondaryColor }}
                        ></div>
                        <input
                          type="text"
                          value={settings.secondaryColor}
                          onChange={(e) =>
                            handleChange("secondaryColor", e.target.value)
                          }
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 uppercase font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 mt-4">
                    <label className="text-sm font-bold text-slate-900 mb-4 block">
                      Theme Preview
                    </label>
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
                      <div
                        className="absolute top-0 left-0 w-full h-1"
                        style={{ backgroundColor: settings.primaryColor }}
                      ></div>
                      <div className="flex items-center justify-between">
                        <div
                          className="w-1/3 h-4 rounded-full"
                          style={{ backgroundColor: settings.primaryColor }}
                        ></div>
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: settings.secondaryColor }}
                        ></div>
                      </div>
                      <div className="space-y-3 mt-4">
                        <div className="w-3/4 h-3 rounded-full bg-slate-200"></div>
                        <div className="w-1/2 h-3 rounded-full bg-slate-200"></div>
                        <div className="w-5/6 h-3 rounded-full bg-slate-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-indigo-600" /> Email Server
                  (SMTP)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      placeholder="smtp.mailgun.org"
                      value={settings.smtpHost}
                      onChange={(e) => handleChange("smtpHost", e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      SMTP Port
                    </label>
                    <input
                      type="text"
                      placeholder="587"
                      value={settings.smtpPort}
                      onChange={(e) => handleChange("smtpPort", e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      SMTP User
                    </label>
                    <input
                      type="text"
                      placeholder="postmaster@yourdomain.com"
                      value={settings.smtpUser}
                      onChange={(e) => handleChange("smtpUser", e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-medium"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      SMTP Password
                    </label>
                    <input
                      type="password"
                      value={settings.smtpPassword}
                      onChange={(e) =>
                        handleChange("smtpPassword", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      Sender Name
                    </label>
                    <input
                      type="text"
                      placeholder="GlobalGrad"
                      value={settings.senderName}
                      onChange={(e) =>
                        handleChange("senderName", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      Sender Email
                    </label>
                    <input
                      type="email"
                      placeholder="noreply@globalgrad.com"
                      value={settings.senderEmail}
                      onChange={(e) =>
                        handleChange("senderEmail", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Bell className="w-6 h-6 text-indigo-600" /> Notifications &
                  Alerts
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      field: "emailNotifications",
                      label: "Email Notifications",
                      desc: "Enable global email delivery for all notifications.",
                    },
                    {
                      field: "adminAlerts",
                      label: "Admin Alerts",
                      desc: "Receive critical system alerts and errors to admin accounts.",
                    },
                    {
                      field: "userRegistrationAlerts",
                      label: "User Registration Alerts",
                      desc: "Notify admins when a new user signs up.",
                    },
                    {
                      field: "applicationAlerts",
                      label: "Application Alerts",
                      desc: "Notify admins when a new university application is submitted.",
                    },
                    {
                      field: "marketingEmails",
                      label: "Marketing Emails",
                      desc: "Automatically enroll users in marketing and newsletter emails.",
                    },
                  ].map((item) => (
                    <label
                      key={item.field}
                      className="flex items-center justify-between p-5 border border-slate-200 rounded-2xl cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {item.label}
                        </div>
                        <div className="text-sm text-slate-500 font-medium mt-1">
                          {item.desc}
                        </div>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings[item.field]}
                          onChange={(e) =>
                            handleChange(item.field, e.target.checked)
                          }
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "storage" && (
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <HardDrive className="w-6 h-6 text-indigo-600" /> Storage
                  Capacity
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Storage Provider
                    </div>
                    <div className="text-xl font-black text-slate-900 flex items-center gap-2">
                      Firebase Storage{" "}
                      <Check className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Space Used
                        </div>
                        <div className="text-2xl font-black text-slate-900">
                          4.2 GB{" "}
                          <span className="text-sm text-slate-500 font-medium">
                            / 10 GB
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: "42%" }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      Image Upload Limit
                    </label>
                    <select
                      value={settings.imageUploadLimits}
                      onChange={(e) =>
                        handleChange("imageUploadLimits", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-bold"
                    >
                      <option value="2MB">2 MB</option>
                      <option value="5MB">5 MB</option>
                      <option value="10MB">10 MB</option>
                      <option value="Unlimited">Unlimited</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-2 block">
                      Document Upload Limit
                    </label>
                    <select
                      value={settings.documentUploadLimits}
                      onChange={(e) =>
                        handleChange("documentUploadLimits", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-bold"
                    >
                      <option value="5MB">5 MB</option>
                      <option value="10MB">10 MB</option>
                      <option value="50MB">50 MB</option>
                      <option value="Unlimited">Unlimited</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-indigo-600" /> Platform Security
                </h3>

                <div className="space-y-6">
                  <label className="flex items-center justify-between p-5 border border-slate-200 rounded-2xl cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-bold text-slate-900">
                        Enforce 2-Factor Authentication
                      </div>
                      <div className="text-sm text-slate-500 font-medium mt-1">
                        Require users to setup 2FA upon registration.
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.enable2FA}
                        onChange={(e) =>
                          handleChange("enable2FA", e.target.checked)
                        }
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </div>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-bold text-slate-900 mb-2 block">
                        Password Policy
                      </label>
                      <select
                        value={settings.passwordPolicy}
                        onChange={(e) =>
                          handleChange("passwordPolicy", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-bold"
                      >
                        <option value="Basic">Basic (8 chars)</option>
                        <option value="Strong">
                          Strong (8 chars + symbols)
                        </option>
                        <option value="Strict">
                          Strict (12 chars + mixed + symbols)
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-900 mb-2 block">
                        Session Timeout
                      </label>
                      <select
                        value={settings.sessionTimeout}
                        onChange={(e) =>
                          handleChange("sessionTimeout", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-bold"
                      >
                        <option value="1 Hour">1 Hour</option>
                        <option value="24 Hours">24 Hours</option>
                        <option value="7 Days">7 Days</option>
                        <option value="Never">Never expire</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-900 mb-2 block">
                        Max Login Attempts
                      </label>
                      <select
                        value={settings.loginAttempts}
                        onChange={(e) =>
                          handleChange("loginAttempts", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-bold"
                      >
                        <option value="3">3 Attempts</option>
                        <option value="5">5 Attempts</option>
                        <option value="10">10 Attempts</option>
                        <option value="Unlimited">Unlimited</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-900 mb-2 block">
                        Admin Access Controls
                      </label>
                      <select
                        value={settings.adminAccessControls}
                        onChange={(e) =>
                          handleChange("adminAccessControls", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-bold"
                      >
                        <option value="Open">Open (All Admins)</option>
                        <option value="Strict">
                          Strict (Super Admins Only)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "backup" && (
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Database className="w-6 h-6 text-indigo-600" /> Backup &
                  Disaster Recovery
                </h3>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <button
                    onClick={handleCreateBackup}
                    className="flex-1 px-5 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/20"
                  >
                    <Database className="w-5 h-5" /> Create Full Backup
                  </button>
                  <button className="flex-1 px-5 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                    <UploadCloud className="w-5 h-5" /> Restore Backup
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                    Backup History
                  </h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            Date
                          </th>
                          <th className="px-6 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            Type
                          </th>
                          <th className="px-6 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            Size
                          </th>
                          <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            Today, 2:00 AM
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                              Automated
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">
                            1.4 GB
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-indigo-600 hover:text-indigo-800 font-bold p-2">
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            Yesterday, 2:00 AM
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                              Automated
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">
                            1.4 GB
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-indigo-600 hover:text-indigo-800 font-bold p-2">
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            Oct 12, 4:45 PM
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                              Manual
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">
                            1.3 GB
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-indigo-600 hover:text-indigo-800 font-bold p-2">
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
