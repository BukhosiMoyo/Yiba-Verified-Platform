"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Building2, Check, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Institution {
  institution_id: string;
  legal_name: string;
  trading_name: string | null;
  province: string;
  registration_number: string;
  current_admin?: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface InstitutionSearchProps {
  value?: string; // institution_id
  onChange: (institutionId: string | null, institution: Institution | null) => void;
  placeholder?: string;
  showAdminInfo?: boolean; // Show admin info when searching (for INSTITUTION_ADMIN role)
  disabled?: boolean;
  className?: string;
}

export function InstitutionSearch({
  value,
  onChange,
  placeholder = "Search institutions...",
  showAdminInfo = false,
  disabled = false,
  className,
}: InstitutionSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch selected institution when value changes
  useEffect(() => {
    if (value && !selectedInstitution) {
      fetchInstitutionById(value);
    } else if (!value) {
      setSelectedInstitution(null);
    }
  }, [value]);

  const fetchInstitutionById = async (institutionId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/platform-admin/institutions/${institutionId}`);
      if (response.ok) {
        const data = await response.json();
        const raw = data.institution ?? data;
        if (raw?.institution_id) {
          const admin = raw.users?.find(
            (u: { role: string; status: string }) => u.role === "INSTITUTION_ADMIN" && u.status === "ACTIVE"
          );
          setSelectedInstitution({
            institution_id: raw.institution_id,
            legal_name: raw.legal_name,
            trading_name: raw.trading_name ?? null,
            province: raw.province,
            registration_number: raw.registration_number,
            current_admin: admin
              ? {
                  user_id: admin.user_id,
                  first_name: admin.first_name,
                  last_name: admin.last_name,
                  email: admin.email,
                }
              : null,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch institution:", err);
    } finally {
      setLoading(false);
    }
  };

  const searchInstitutions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setInstitutions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/platform-admin/institutions/search?q=${encodeURIComponent(query)}&limit=20`
      );
      
      if (!response.ok) {
        throw new Error("Failed to search institutions");
      }

      const data = await response.json();
      setInstitutions(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search institutions");
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchInstitutions(searchQuery);
      }, 300);
    } else {
      setInstitutions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelect = (institution: Institution) => {
    setSelectedInstitution(institution);
    onChange(institution.institution_id, institution);
    setOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    setSelectedInstitution(null);
    onChange(null, null);
    setSearchQuery("");
  };

  const displayName = selectedInstitution
    ? selectedInstitution.trading_name || selectedInstitution.legal_name
    : "";

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-10 w-full justify-between rounded-lg border-border bg-background px-3 text-left font-normal shadow-sm transition-colors hover:bg-accent/50 hover:border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              open && "border-primary/50 ring-1 ring-primary/20"
            )}
            disabled={disabled}
            onClick={() => {
              if (!open) {
                inputRef.current?.focus();
              }
            }}
          >
            <span className="truncate flex-1 text-left text-sm text-foreground">
              {displayName || placeholder}
            </span>
            <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="z-[110] w-[var(--radix-popover-trigger-width)] rounded-xl border border-border bg-card p-0 shadow-lg text-card-foreground"
          align="start"
          sideOffset={6}
        >
          <div className="p-2.5 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search by name or registration number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-lg border-border bg-background pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto p-1.5">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Searching...</span>
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {!loading && !error && searchQuery.trim().length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}
            {!loading && !error && searchQuery.trim().length >= 2 && institutions.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No institutions found
              </div>
            )}
            {!loading && !error && institutions.length > 0 && (
              <div className="space-y-0.5">
                {institutions.map((institution) => {
                  const isSelected = selectedInstitution?.institution_id === institution.institution_id;
                  const name = institution.trading_name || institution.legal_name;
                  return (
                    <div
                      key={institution.institution_id}
                      className={cn(
                        "flex cursor-pointer select-none flex-col items-start rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent",
                        isSelected && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleSelect(institution)}
                    >
                      <div className="flex w-full items-center gap-2.5">
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate text-foreground">{name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {institution.registration_number} • {institution.province}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </div>
                      {showAdminInfo && institution.current_admin && (
                        <div className="mt-1.5 ml-6 flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>
                            Admin: {institution.current_admin.first_name} {institution.current_admin.last_name} ({institution.current_admin.email})
                          </span>
                        </div>
                      )}
                      {showAdminInfo && !institution.current_admin && (
                        <div className="mt-1.5 ml-6 text-xs italic text-muted-foreground">
                          No admin assigned
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selectedInstitution && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary" className="rounded-md text-xs font-medium">
            {selectedInstitution.trading_name || selectedInstitution.legal_name}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
