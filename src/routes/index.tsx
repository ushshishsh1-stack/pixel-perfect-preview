import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareText } from "lucide-react";
import { useState } from "react";

import { ChatPanel } from "@/components/inbox/ChatPanel";
import { LeadInfoPanel } from "@/components/inbox/LeadInfoPanel";
import { LeadList } from "@/components/inbox/LeadList";
import { demoLeads } from "@/lib/inbox-demo";
import type { Lead } from "@/lib/inbox-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Central de Atendimento — Gaviões 24h" },
      { name: "description", content: "Atenda leads do WhatsApp com temperatura, pontuação de interesse e automação em uma só tela." },
      { property: "og:title", content: "Central de Atendimento — Gaviões 24h" },
      { property: "og:description", content: "Conversas, temperatura e automação dos leads em uma só tela." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inbox,
});

function Inbox() {
  const [leads, setLeads] = useState<Lead[]>(demoLeads);
  const [selected, setSelected] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(true);
  const [flashing] = useState<Set<string>>(new Set());
  const lead = leads.find((l) => l.phone === selected) ?? null;

  const update = (phone: string, fn: (l: Lead) => Lead) => setLeads((ls) => ls.map((l) => (l.phone === phone ? fn(l) : l)));

  const select = (phone: string) => {
    setSelected(phone);
    update(phone, (l) => ({ ...l, unread: 0 }));
  };

  // Ponto de integração: substituir pelo envio real (sendMessageIdempotent).
  const send = (text: string) => {
    if (!lead) return;
    const id = crypto.randomUUID();
    const phone = lead.phone;
    update(phone, (l) => ({
      ...l,
      messages: [...l.messages, { id, direction: "OUT", content: text, at: new Date().toISOString(), status: "PENDING", author: l.attendant ?? "Você" }],
    }));
    setTimeout(() => update(phone, (l) => ({ ...l, messages: l.messages.map((m) => (m.id === id ? { ...m, status: "SENT" } : m)) })), 700);
  };

  // Ponto de integração: substituir por claimConversation.
  const claim = () => {
    if (!lead) return;
    update(lead.phone, (l) => ({
      ...l,
      handler: "HUMANO",
      attendant: "Você",
      status: "ONLINE",
      typing: false,
      automation: { ...l.automation, lastAction: "Pausada pelo atendente", nextAction: null },
      history: [...l.history, { at: new Date().toISOString(), label: "Você assumiu o atendimento" }],
    }));
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Leads */}
      <div className={cn("h-full w-full shrink-0 border-r border-border md:w-[340px] lg:w-[380px]", lead && "hidden md:block")}>
        <LeadList leads={leads} selected={selected} flashing={flashing} onSelect={select} />
      </div>

      {/* Conversa */}
      <main className={cn("h-full min-w-0 flex-1", !lead && "hidden md:block")}>
        {lead ? (
          <ChatPanel lead={lead} onBack={() => setSelected(null)} onInfo={() => setInfoOpen((o) => !o)} infoOpen={infoOpen} onSend={send} onClaim={claim} />
        ) : (
          <div className="chat-bg flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-send">
              <MessageSquareText className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold">Central de Atendimento</h2>
            <p className="max-w-sm text-sm text-muted-foreground">Selecione uma conversa para ver as mensagens, a temperatura e quem está atendendo o lead.</p>
          </div>
        )}
      </main>

      {/* Informações */}
      {lead && infoOpen && (
        <div className="fixed inset-0 z-30 animate-msg-in xl:static xl:z-auto xl:h-full xl:w-[340px] xl:shrink-0 xl:border-l xl:border-border">
          <div className="absolute inset-0 bg-secondary/40 xl:hidden" onClick={() => setInfoOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm shadow-soft xl:static xl:max-w-none xl:shadow-none">
            <LeadInfoPanel lead={lead} onClose={() => setInfoOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
