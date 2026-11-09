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
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-4 py-2 text-sm sm:px-6">
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">Demo workspaces</span>
          {ROLES.map((r) => (
            <Link key={r.to} to={r.to}
              className={cn("shrink-0 rounded-full px-3 py-1 transition-colors", pathname.startsWith(r.to) ? "bg-primary-soft text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground")}>
              {r.label}
            </Link>
          ))}
        </div>
      </div>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-sm text-background">M</span>
            <span>Meda Garage <span className="text-xs font-normal text-muted-foreground">/ PartMatch</span></span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={cn("rounded-lg px-3 py-2 text-sm", pathname === n.to ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}>
                {n.label}
              </Link>
            ))}
          </nav>
          <button className="rounded-lg p-2 md:hidden" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu(!menu)}>
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menu && (
          <nav className="border-t border-border px-4 py-2 md:hidden" aria-label="Mobile">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setMenu(false)} className="block rounded-lg px-2 py-3 text-base">{n.label}</Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>Research prototype · example offers only · no payments</p>
          <Link to="/about" className="hover:text-foreground">About this prototype</Link>
        </div>
      </footer>

      <button onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-soft hover:border-primary/50">
        <MessageSquareHeart className="h-4 w-4 text-primary" /> Give feedback
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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