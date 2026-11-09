import { Link, useLocation } from "@tanstack/react-router";
import { MessageSquareHeart, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FeedbackForm } from "./FeedbackForm";

const NAV = [
  { to: "/find", label: "Request a part" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/feedback", label: "Interview feedback" },
] as const;

const ROLES = [
  { to: "/requests", label: "Buyer requests" },
  { to: "/specialist", label: "Specialist review" },
  { to: "/supplier", label: "Supplier offers" },
  { to: "/research", label: "UAT dashboard" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <div className="flex min-h-[100dvh] min-w-0 flex-col">
      <div className="border-b border-border bg-card">
        <nav aria-label="Demo workspaces" className="mx-auto flex max-w-6xl snap-x items-center gap-2 overflow-x-auto overscroll-x-contain px-4 py-2 text-sm sm:gap-3 sm:px-6">
          <span className="shrink-0 pr-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">Demo roles →</span>
          {ROLES.map((r) => (
            <Link key={r.to} to={r.to}
              className={cn("inline-flex min-h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-full px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", pathname.startsWith(r.to) ? "bg-primary-soft text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground")}>
              {r.label}
            </Link>
          ))}
        </nav>
      </div>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight sm:text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-sm text-background">M</span>
            <span className="min-w-0 truncate">Meda Garage <span className="hidden text-xs font-normal text-muted-foreground sm:inline">/ PartMatch</span></span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={cn("rounded-lg px-3 py-2 text-sm", pathname === n.to ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}>
                {n.label}
              </Link>
            ))}
          </nav>
          <button className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu(!menu)}>
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menu && (
          <nav className="border-t border-border px-4 py-3 md:hidden" aria-label="Mobile navigation">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setMenu(false)} className="flex min-h-11 items-center rounded-lg px-2 py-3 text-base">{n.label}</Link>
            ))}
            <p className="mb-2 mt-3 border-t border-border pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demo workspaces</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <Link key={r.to} to={r.to} onClick={() => setMenu(false)} className={cn("flex min-h-12 items-center rounded-xl border px-3 py-2 text-sm font-medium", pathname.startsWith(r.to) ? "border-primary bg-primary-soft text-accent-foreground" : "border-border bg-card")}>
                  {r.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-7 pb-16 sm:px-6 sm:py-12 sm:pb-20">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>Research prototype · example offers only · no payments</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2"><Link to="/feedback" className="hover:text-foreground">Give interview feedback</Link><Link to="/about" className="hover:text-foreground">About this prototype</Link></div>
        </div>
      </footer>

      <button onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-soft hover:border-primary/50">
        <MessageSquareHeart className="h-4 w-4 text-primary" /> Give feedback
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick feedback</DialogTitle>
            <DialogDescription>Short anonymous user-testing questions.</DialogDescription>
          </DialogHeader>
          <FeedbackForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}