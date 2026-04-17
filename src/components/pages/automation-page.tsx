"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  History,
  Mail,
  PauseCircle,
  PlayCircle,
  Plus,
  Receipt,
  Settings2,
  ShieldAlert,
  Timer,
  X,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";

import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LogoImage from "@/assets/logo.png";
import { useOpsStore } from "@/store/ops-store";

type RuleChoice = {
  id: string;
  label: string;
  hint: string;
  icon: typeof Zap;
};

const TRIGGERS: RuleChoice[] = [
  { id: "completion", label: "On Project Completion", hint: "Instant trigger", icon: Zap },
  { id: "legal", label: "Contract Signed", hint: "Execute on legal approval", icon: FileText },
  { id: "billing", label: "Invoice Finalized", hint: "Trigger post-billing", icon: Receipt },
  { id: "timer", label: "Scheduled Interval", hint: "Daily, Weekly, Monthly", icon: Timer },
  { id: "alert", label: "Resource Threshold", hint: "Budget or risk alert", icon: ShieldAlert },
];

const ACTIONS: RuleChoice[] = [
  { id: "email", label: "Send Branded Email", hint: "Personalized client touchpoint", icon: Mail },
  { id: "contract", label: "Create Draft Contract", hint: "Generate agreement automatically", icon: FileText },
  { id: "invoice", label: "Generate Pending Invoice", hint: "Prepare billing for review", icon: Receipt },
  { id: "notification", label: "Internal Alert", hint: "Notify team via email", icon: ShieldAlert },
];

const DEFAULT_TEMPLATE =
  "Hello {ClientName},\n\nThis automation run completed for {ProjectName}. Reference: {InvoiceNumber}.\n\nRegards,\nOps Team";

function formatRelativeTime(iso: string) {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const deltaHours = Math.max(1, Math.floor(deltaMs / (1000 * 60 * 60)));
  if (deltaHours < 24) return `${deltaHours}h ago`;
  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
}

export function AutomationPageClient() {
  const {
    automationRules,
    clients,
    projects,
    users,
    invoices,
    toggleAutomationRule,
    updateAutomationRuleTemplate,
    addAutomationRule,
  } = useOpsStore(
    useShallow((state) => ({
      automationRules: state.automationRules,
      clients: state.clients,
      projects: state.projects,
      users: state.users,
      invoices: state.invoices,
      toggleAutomationRule: state.toggleAutomationRule,
      updateAutomationRuleTemplate: state.updateAutomationRuleTemplate,
      addAutomationRule: state.addAutomationRule,
    })),
  );

  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creationStep, setCreationStep] = useState<1 | 2>(1);
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  const activeRules = automationRules.filter((rule) => rule.status === "active");
  const avgSuccessRate = automationRules.length
    ? (
      automationRules.reduce((sum, rule) => sum + rule.successRate, 0) / automationRules.length
    ).toFixed(1)
    : "0.0";
  const estimatedHoursSaved = activeRules.length * 12;
  const errorProneRules = automationRules.filter((rule) => rule.successRate < 95).length;
  const activeRule = automationRules.find((rule) => rule.id === selectedRuleId);

  const previewContext = useMemo(() => {
    const sampleClient = clients[0]?.name ?? "Client";
    const sampleProject = projects[0]?.name ?? "Project";
    const sampleMember = users[0]?.name ?? "Team Member";
    const sampleInvoice = invoices[0]?.id?.toUpperCase() ?? "INV-001";
    const sampleManager = users.find((user) => /manager/i.test(user.role))?.name ?? users[0]?.name ?? "Manager";
    return { sampleClient, sampleProject, sampleMember, sampleInvoice, sampleManager };
  }, [clients, projects, users, invoices]);

  const renderedTemplate = (template: string) =>
    template
      .replaceAll("{ClientName}", previewContext.sampleClient)
      .replaceAll("{ProjectName}", previewContext.sampleProject)
      .replaceAll("{TeamMember}", previewContext.sampleMember)
      .replaceAll("{InvoiceNumber}", previewContext.sampleInvoice)
      .replaceAll("{ManagerName}", previewContext.sampleManager);

  const resetModal = () => {
    setShowCreateModal(false);
    setCreationStep(1);
    setSelectedTriggerId(null);
    setSelectedActionId(null);
  };

  const createWorkflow = () => {
    if (!selectedTriggerId || !selectedActionId) return;
    const selectedTrigger = TRIGGERS.find((item) => item.id === selectedTriggerId);
    const selectedAction = ACTIONS.find((item) => item.id === selectedActionId);
    if (!selectedTrigger || !selectedAction) return;

    addAutomationRule({
      name: `${selectedTrigger.label} → ${selectedAction.label}`,
      description: `${selectedAction.hint} when ${selectedTrigger.label.toLowerCase()} happens.`,
      type:
        selectedTrigger.id === "timer" ? "scheduled" : selectedTrigger.id === "alert" ? "alert" : "trigger",
      trigger: selectedTrigger.id,
      action: selectedAction.id,
      emailTemplate: DEFAULT_TEMPLATE,
      impactLabel: "New workflow in demo mode",
    });
    resetModal();
  };

  return (
    <>
      <section className="h-full min-h-0 overflow-y-auto pr-1">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between py-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-slate-800 tracking-[-0.03em]">Automation Hub</h1>
            </div>
            <Button
              variant="primary"
              className="h-11 px-3 sm:px-6 gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="hidden sm:inline">New Workflow</span>
            </Button>
          </div>

          <StatStrip
            stats={[
              {
                label: "Active Rules",
                value: String(activeRules.length),
                hint: `${automationRules.length} total rules`,
              },
              { label: "Success Rate", value: `${avgSuccessRate}%`, valueTone: "success", hint: "Average run quality" },
              { label: "Hours Saved", value: `${estimatedHoursSaved}h`, hint: "Estimated manual effort offset" },
              {
                label: "System Health",
                value: errorProneRules === 0 ? "Stable" : "Needs review",
                valueTone: errorProneRules === 0 ? "success" : "warning",
                hint: `${errorProneRules} rules under 95%`,
              },
            ]}
          />

          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-slate-400" />
                Active Workflows
              </CardTitle>
              <Badge
                label={errorProneRules === 0 ? "All Systems Go" : "Needs Review"}
                tone={errorProneRules === 0 ? "success" : "warning"}
              />
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {automationRules.map((rule) => {
                  return (
                    <div
                      key={rule.id}
                      className="group p-5 rounded-2xl border border-slate-200/60 bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between h-full"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div
                            className={clsx(
                              "p-2.5 rounded-xl",
                              rule.type === "trigger"
                                ? "bg-blue-50 text-blue-600"
                                : rule.type === "scheduled"
                                  ? "bg-purple-50 text-purple-600"
                                  : "bg-amber-50 text-amber-600",
                            )}
                          >
                            {rule.type === "trigger" ? (
                              <Zap className="h-5 w-5" />
                            ) : rule.type === "scheduled" ? (
                              <Timer className="h-5 w-5" />
                            ) : (
                              <ShieldAlert className="h-5 w-5" />
                            )}
                          </div>
                          <button
                            onClick={() => toggleAutomationRule(rule.id)}
                            className={clsx(
                              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                              rule.status === "active"
                                ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100"
                                : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100",
                            )}
                          >
                            {rule.status === "active" ? (
                              <>
                                <PauseCircle className="h-3.5 w-3.5" /> Pause
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-3.5 w-3.5" /> Resume
                              </>
                            )}
                          </button>
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-800 tracking-tight">{rule.name}</h3>
                          <p className="text-sm text-slate-500 leading-relaxed min-h-[40px]">{rule.description}</p>
                        </div>
                      </div>

                      <div className="pt-6 mt-auto border-t border-slate-50 flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <History className="h-3 w-3" />
                            Last: {formatRelativeTime(rule.lastRunAt)}
                          </div>
                          <Badge
                            label={`${rule.impactLabel} · ${rule.successRate.toFixed(1)}%`}
                            tone="neutral"
                            className="bg-slate-50 text-slate-500 border-none px-0 lowercase text-[11px]"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          className="h-9 px-3 sm:px-4 text-xs font-bold gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shrink-0 whitespace-nowrap"
                          onClick={() => setSelectedRuleId(rule.id)}
                        >
                          <span className="hidden sm:inline">Configure Email</span>
                          <span className="inline sm:hidden">Configure</span>
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
      </section>

      {selectedRuleId && activeRule ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setSelectedRuleId(null)}
          />

          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-400">
            <div className="flex-1 flex flex-col border-r border-slate-100">
              <div className="p-6 sm:p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Configure Email Action</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{activeRule.name}</p>
                </div>
                <button
                  onClick={() => setSelectedRuleId(null)}
                  className="p-2 rounded-full text-slate-300 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Personalized Message Template
                  </label>
                  <textarea
                    value={activeRule.emailTemplate}
                    onChange={(event) => updateAutomationRuleTemplate(activeRule.id, event.target.value)}
                    className="w-full h-64 p-5 rounded-2xl border border-slate-200 bg-slate-50/30 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none leading-relaxed font-medium"
                    placeholder="Draft your automated message..."
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["{ClientName}", "{ProjectName}", "{InvoiceNumber}", "{TeamMember}", "{ManagerName}"].map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                          onClick={() => updateAutomationRuleTemplate(activeRule.id, `${activeRule.emailTemplate} ${tag}`)}
                        >
                          {tag}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <Card className="bg-emerald-50/50 border-emerald-100 shadow-none border">
                  <CardContent className="p-4 flex gap-3">
                    <ShieldAlert className="h-5 w-5 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                      Template tags are resolved from frontend demo data in the shared mock store before previewing and
                      dispatching.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="p-6 sm:p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  onClick={() => setSelectedRuleId(null)}
                  className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Close
                </button>
                <Button variant="primary" className="h-11 px-8 shadow-lg" onClick={() => setSelectedRuleId(null)}>
                  Save & Keep Rule
                </Button>
              </div>
            </div>

            <div className="hidden lg:flex flex-col w-[400px] bg-slate-50/80 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Visual Preview</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600">LIVE SYNC</span>
                </div>
              </div>

              <div className="flex-1 rounded-3xl border border-white bg-white shadow-2xl flex flex-col overflow-hidden">
                <div className="px-5 py-4 bg-white border-b border-slate-50 flex flex-col items-center gap-4">
                  <Image src={LogoImage} alt="Atcon Logo" height={22} className="opacity-90 grayscale contrast-125" />
                  <div className="w-full space-y-2 pt-2">
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="w-8 text-slate-300 font-bold uppercase tracking-tighter">To</span>
                      <span className="font-bold text-slate-600 truncate">
                        {previewContext.sampleClient} &lt;contact@client.com&gt;
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] border-t border-slate-50 pt-2">
                      <span className="w-8 text-slate-300 font-bold uppercase tracking-tighter">Sub</span>
                      <span className="font-bold text-slate-900 truncate">{activeRule.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-medium overflow-y-auto">
                  {renderedTemplate(activeRule.emailTemplate)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateModal ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={resetModal}
          />
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {creationStep === 1 ? "1. Select Trigger" : "2. Select Action"}
                </h2>
                <p className="text-sm text-slate-500">
                  {creationStep === 1
                    ? "What event should start this workflow?"
                    : "What should happen when the trigger fires?"}
                </p>
              </div>
              <button onClick={resetModal} className="p-2 rounded-full text-slate-400 hover:bg-slate-50 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {(creationStep === 1 ? TRIGGERS : ACTIONS).map((item) => {
                const isSelected =
                  creationStep === 1 ? selectedTriggerId === item.id : selectedActionId === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={clsx(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/5 shadow-sm"
                        : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200",
                    )}
                    type="button"
                    onClick={() =>
                      creationStep === 1 ? setSelectedTriggerId(item.id) : setSelectedActionId(item.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          "p-2 rounded-lg bg-white border shadow-sm",
                          isSelected ? "border-emerald-200 text-emerald-600" : "border-slate-100 text-slate-400",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.label}</p>
                        <p className="text-[11px] font-medium text-slate-400">{item.hint}</p>
                      </div>
                    </div>
                    {isSelected ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : null}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex gap-3">
              {creationStep === 1 ? (
                <>
                  <Button variant="ghost" className="flex-1 h-12" onClick={resetModal}>
                    Cancel
                  </Button>
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
                  <Button variant="ghost" className="flex-1 h-12" onClick={() => setCreationStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-[2] h-12 shadow-lg disabled:opacity-30 disabled:grayscale transition-all"
                    disabled={!selectedActionId}
                    onClick={createWorkflow}
                  >
                    Finalize Workflow
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}