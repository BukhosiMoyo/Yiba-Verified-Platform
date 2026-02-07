"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter, RefreshCcw } from "lucide-react";
import { InstitutionFilters } from "@/lib/outreach/types";
import { useState } from "react";

interface PipelineFiltersProps {
    onFilterChange: (filters: InstitutionFilters) => void;
}

export function PipelineFilters({ onFilterChange }: PipelineFiltersProps) {
    const [search, setSearch] = useState("");
    const [province, setProvince] = useState("all");

    const handleSearch = () => {
        onFilterChange({
            search: search || undefined,
            province: province !== "all" ? province : undefined,
        });
    };

    return (
        <div className="flex items-center space-x-2">
            <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search institutions..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
            </div>
            <Select value={province} onValueChange={setProvince}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Province" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    <SelectItem value="Gauteng">Gauteng</SelectItem>
                    <SelectItem value="Western Cape">Western Cape</SelectItem>
                    <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                    <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleSearch}>
                <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => {
                setSearch("");
                setProvince("all");
                onFilterChange({});
            }}>
                <RefreshCcw className="h-4 w-4" />
            </Button>
        </div>
    );
}
