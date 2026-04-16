"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  CheckCircle2, 
  History, 
  Mail, 
  PauseCircle, 
  PlayCircle, 
  Plus, 
  Settings2, 
  ShieldAlert, 
  Timer, 
  Zap,
  X,
  ExternalLink,
  FileText,
  Receipt,
  ArrowRight
} from "lucide-react";
import clsx from "clsx";

import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LogoImage from "@/assets/logo.png";

type AutomationRule = {
  id: string;
  name: string;
  description: string;
  type: "trigger" | "scheduled" | "alert";
  status: "active" | "paused";
  lastRun: string;
  successRate: number;
  impactLabel: string;
};

const INITIAL_RULES: AutomationRule[] = [
  {
    id: "1",
    name: "Auto-Invoice Generator",
    description: "Automatically generates and sends invoices when a project reaches 100% completion.",
    type: "trigger",
    status: "active",
    lastRun: "2 hours ago",
    successRate: 100,
    impactLabel: "Saved 42h this month",
  },
  {
    id: "2",
    name: "Late Timesheet Reminders",
    description: "Sends Slack notifications to team members with missing logs every Friday at 4 PM.",
    type: "scheduled",
    status: "active",
    lastRun: "3 days ago",
    successRate: 98.4,
    impactLabel: "85% on-time submission rate",
  },
  {
    id: "3",
    name: "Budget Risk Sentinel",
    description: "Alerts project managers when burn rate exceeds 85% of total budget.",
    type: "alert",
    status: "paused",
    lastRun: "1 week ago",
    successRate: 100,
    impactLabel: "Prevented 3 budget overruns",
  },
  {
    id: "4",
    name: "Weekly Client Pulse",
    description: "Aggregates project health and sends a summary report to all premium clients.",
    type: "scheduled",
    status: "active",
    lastRun: "6 days ago",
    successRate: 99.1,
    impactLabel: "Saved 12h reporting time",
  },
];

export function AutomationPageClient() {
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  
  // New Workflow States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creationStep, setCreationStep] = useState<1 | 2>(1);
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  const [customMessages, setCustomMessages] = useState<Record<string, string>>({
    "1": "Hello {ClientName},\n\nGood news! Project {ProjectName} has been successfully completed. We've attached the final invoice for your review.\n\nThank you for choosing us for this rollout!",
    "2": "Hi {TeamMember},\n\nJust a quick nudge that your timesheet for this week is still pending. Please log your hours by end of day to ensure smooth processing.\n\nBest,\nOps Team",
  });

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, status: rule.status === "active" ? "paused" : "active" } : rule
    ));
  };

  const handleMessageChange = (id: string, val: string) => {
    setCustomMessages(prev => ({ ...prev, [id]: val }));
  };

  const resetModal = () => {
    setShowCreateModal(false);
    setCreationStep(1);
    setSelectedTriggerId(null);
    setSelectedActionId(null);
  };

  const activeRule = rules.find(r => r.id === selectedRuleId);

  return (
    <>
      <section className="h-full min-h-0 overflow-y-auto pr-1">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between py-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-slate-800 tracking-[-0.03em]">Automation Hub</h1>
              <p className="text-sm text-slate-500 font-medium">Manage your system triggers and automated business rules.</p>
            </div>
            <Button 
              variant="primary" 
              className="h-11 px-6 gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>New Workflow</span>
            </Button>
          </div>

          <StatStrip
            stats={[
              { label: "Active Rules", value: String(rules.filter(r => r.status === "active").length), hint: `${rules.length} total rules` },
              { label: "Success Rate", value: "99.8%", valueTone: "success", hint: "Last 30 days" },
              { label: "Hours Saved", value: "154h", hint: "Est. manual task offset" },
              { label: "System Health", value: "Stable", valueTone: "success", hint: "All engines nominal" },
            ]}
          />

          <div className="space-y-6">
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-slate-400" />
                  Active Workflows
                </CardTitle>
                <div className="hidden sm:flex items-center gap-2">
                   <Badge label="All Systems Go" tone="success" className="bg-emerald-50 text-emerald-700 border-emerald-100" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rules.map((rule) => {
                    return (
                      <div key={rule.id} className="group p-5 rounded-2xl border border-slate-200/60 bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between h-full">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className={clsx(
                              "p-2.5 rounded-xl",
                              rule.type === "trigger" ? "bg-blue-50 text-blue-600" : 
                              rule.type === "scheduled" ? "bg-purple-50 text-purple-600" : 
                              "bg-amber-50 text-amber-600"
                            )}>
                              {rule.type === "trigger" && <Zap className="h-5 w-5" />}
                              {rule.type === "scheduled" && <Timer className="h-5 w-5" />}
                              {rule.type === "alert" && <ShieldAlert className="h-5 w-5" />}
                            </div>
                            <button 
                              onClick={() => toggleRule(rule.id)}
                              className={clsx(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                rule.status === "active" 
                                  ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100" 
                                  : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              )}
                            >
                              {rule.status === "active" ? (
                                <><PauseCircle className="h-3.5 w-3.5" /> Pause</>
                              ) : (
                                <><PlayCircle className="h-3.5 w-3.5" /> Resume</>
                              )}
                            </button>
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-slate-800 tracking-tight">{rule.name}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed min-h-[40px]">{rule.description}</p>
                          </div>
                        </div>

                        <div className="pt-6 mt-auto border-t border-slate-50 flex items-center justify-between">
                          <div className="space-y-1">
                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <History className="h-3 w-3" />
                                Last: {rule.lastRun}
                             </div>
                             <Badge label={rule.impactLabel} tone="neutral" className="bg-slate-50 text-slate-500 border-none px-0 lowercase text-[11px]" />
                          </div>
                          <Button 
                            variant="ghost" 
                            className="h-9 px-4 text-xs font-bold gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all font-inter"
                            onClick={() => setSelectedRuleId(rule.id)}
                          >
                            Configure Email
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Email Configuration Modal */}
      {selectedRuleId && activeRule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedRuleId(null)} />
          
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-400">
            {/* Left: Configuration */}
            <div className="flex-1 flex flex-col border-r border-slate-100">
               <div className="p-6 sm:p-8 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Configure Email Action</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{activeRule.name}</p>
                  </div>
                  <button onClick={() => setSelectedRuleId(null)} className="p-2 rounded-full text-slate-300 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Personalized Message Template</label>
                    <textarea 
                      value={customMessages[selectedRuleId] || ""}
                      onChange={(e) => handleMessageChange(selectedRuleId, e.target.value)}
                      className="w-full h-64 p-5 rounded-2xl border border-slate-200 bg-slate-50/30 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none leading-relaxed font-medium"
                      placeholder="Draft your automated message..."
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["{ClientName}", "{ProjectName}", "{Invoice#}", "{DueDay}", "{ManagerName}"].map(tag => (
                         <button 
                           key={tag}
                           type="button"
                           className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                           onClick={() => handleMessageChange(selectedRuleId!, (customMessages[selectedRuleId!] || "") + " " + tag)}
                         >
                           {tag}
                         </button>
                      ))}
                    </div>
                  </div>

                  <Card className="bg-emerald-50/50 border-emerald-100 shadow-none border">
                    <CardContent className="p-4 flex gap-3">
                       <ShieldAlert className="h-5 w-5 text-emerald-600 shrink-0" />
                       <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                         Tags like <code className="font-bold underline">{`{ClientName}`}</code> will be automatically replaced with real-time data from your database before the email is dispatched.
                       </p>
                    </CardContent>
                  </Card>
               </div>

               <div className="p-6 sm:p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4">
                  <button onClick={() => setSelectedRuleId(null)} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Discard</button>
                  <Button variant="primary" className="h-11 px-8 shadow-lg" onClick={() => setSelectedRuleId(null)}>Save & Activate Rule</Button>
               </div>
            </div>

            {/* Right: Premium Mockup */}
            <div className="hidden lg:flex flex-col w-[400px] bg-slate-50/80 p-8">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Visual Preview</h3>
                 <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600">LIVE SYNC</span>
                 </div>
               </div>

               <div className="flex-1 rounded-3xl border border-white bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-500">
                  <div className="px-5 py-4 bg-white border-b border-slate-50 flex flex-col items-center gap-4">
                    <Image src={LogoImage} alt="Atcon Logo" height={22} className="opacity-90 grayscale contrast-125" />
                    <div className="w-full space-y-2 pt-2">
                       <div className="flex items-center gap-3 text-[10px]">
                         <span className="w-8 text-slate-300 font-bold uppercase tracking-tighter">To</span>
                         <span className="font-bold text-slate-600 truncate">Client Portfolio &lt;contact@client.com&gt;</span>
                       </div>
                       <div className="flex items-center gap-3 text-[10px] border-t border-slate-50 pt-2">
                         <span className="w-8 text-slate-300 font-bold uppercase tracking-tighter">Sub</span>
                         <span className="font-bold text-slate-900 truncate">Automation Alert: Project Rollout</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-medium overflow-y-auto">
                    {(customMessages[selectedRuleId] || "")
                      .replace(/{ClientName}/g, "John Smith")
                      .replace(/{ProjectName}/g, "Ops Digital Core")
                      .replace(/{TeamMember}/g, "Alex")}
                  </div>

                  <div className="p-5 border-t border-slate-50 flex justify-center">
                    <div className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-bold tracking-tight text-center">
                      View Deployment Details
                    </div>
                  </div>
               </div>

               <p className="mt-6 text-[10px] text-center text-slate-400 font-medium px-4">
                 This is a representative mockup. Actual email formatting may vary slightly based on client email clients.
               </p>
            </div>
          </div>
        </div>
      )}

      {/* New Workflow Creation Modal (Step-based Wizard) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={resetModal} />
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {creationStep === 1 ? "1. Select Trigger" : "2. Select Action"}
                </h2>
                <p className="text-sm text-slate-500">
                  {creationStep === 1 ? "What event should start this workflow?" : "What should happen when the trigger fires?"}
                </p>
              </div>
              <button onClick={resetModal} className="p-2 rounded-full text-slate-400 hover:bg-slate-50 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {creationStep === 1 ? (
                // Step 1: Trigger Selection
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Trigger Event</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: "completion", icon: Zap, label: "On Project Completion", hint: "Instant trigger" },
                        { id: "legal", icon: FileText, label: "Contract Signed", hint: "Execute on legal approval" },
                        { id: "billing", icon: Receipt, label: "Invoice Finalized", hint: "Trigger post-billing" },
                        { id: "timer", icon: Timer, label: "Scheduled Interval", hint: "Daily, Weekly, Monthly" },
                        { id: "alert", icon: ShieldAlert, label: "Resource Threshold", hint: "Budget or Risk alerts" }
                      ].map((trigger) => {
                        const isSelected = selectedTriggerId === trigger.id;
                        return (
                          <button 
                            key={trigger.id} 
                            className={clsx(
                              "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group/trigger",
                              isSelected ? "border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/5 shadow-sm" : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200"
                            )} 
                            type="button"
                            onClick={() => setSelectedTriggerId(trigger.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={clsx(
                                "p-2 rounded-lg bg-white border shadow-sm transition-colors",
                                isSelected ? "border-emerald-200 text-emerald-600" : "border-slate-100 text-slate-400 group-hover/trigger:text-emerald-500"
                              )}>
                                <trigger.icon className="h-4 w-4" />
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-slate-800">{trigger.label}</p>
                                  <p className="text-[11px] font-medium text-slate-400">{trigger.hint}</p>
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-in zoom-in duration-200" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                // Step 2: Action Selection
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Automated Action</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: "email", icon: Mail, label: "Send Branded Email", hint: "Personalized client touchpoint" },
                        { id: "contract", icon: FileText, label: "Create Draft Contract", hint: "Generate agreement automatically" },
                        { id: "invoice", icon: Receipt, label: "Generate Pending Invoice", hint: "Prepare billing for review" },
                        { id: "notification", icon: ShieldAlert, label: "Internal Alert", hint: "Notify team via Slack/Email" }
                      ].map((action) => {
                        const isSelected = selectedActionId === action.id;
                        return (
                          <button 
                            key={action.id} 
                            className={clsx(
                              "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group/action",
                              isSelected ? "border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/5 shadow-sm" : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200"
                            )} 
                            type="button"
                            onClick={() => setSelectedActionId(action.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={clsx(
                                "p-2 rounded-lg bg-white border shadow-sm transition-colors",
                                isSelected ? "border-emerald-200 text-emerald-600" : "border-slate-100 text-slate-400 group-hover/action:text-emerald-500"
                              )}>
                                <action.icon className="h-4 w-4" />
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-slate-800">{action.label}</p>
                                  <p className="text-[11px] font-medium text-slate-400">{action.hint}</p>
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-in zoom-in duration-200" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              {creationStep === 1 ? (
                <>
                  <Button variant="ghost" className="flex-1 h-12" onClick={resetModal}>Cancel</Button>
                  <Button 
                    variant="primary" 
                    className="flex-[2] h-12 shadow-lg disabled:opacity-30 disabled:grayscale transition-all" 
                    disabled={!selectedTriggerId}
                    onClick={() => setCreationStep(2)}
                  >
                    Next: Choose Action
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="flex-1 h-12" onClick={() => setCreationStep(1)}>Back</Button>
                  <Button 
                    variant="primary" 
                    className="flex-[2] h-12 shadow-lg disabled:opacity-30 disabled:grayscale transition-all" 
                    disabled={!selectedActionId}
                    onClick={resetModal}
                  >
                    Finalize Workflow
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
