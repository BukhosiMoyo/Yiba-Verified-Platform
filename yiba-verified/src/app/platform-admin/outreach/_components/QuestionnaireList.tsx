import { Questionnaire, TemplateStatus } from "@/lib/outreach/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, MoreHorizontal, Plus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuestionnaireListProps {
    questionnaires: Questionnaire[];
    onEdit: (q: Questionnaire) => void;
    onDelete: (id: string) => void;
    onPreview: (q: Questionnaire) => void;
}

export function QuestionnaireList({ questionnaires, onEdit, onDelete, onPreview }: QuestionnaireListProps) {
    return (
        <div className="space-y-4">
            <div className="rounded-md border border-border/40 bg-card overflow-hidden">
                <Table className="bg-card">
                    <TableHeader>
                        <TableRow className="border-border/40 hover:bg-transparent">
                            <TableHead>Title</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Steps</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {questionnaires.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No questionnaires found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            questionnaires.map((q) => (
                                <TableRow key={q.questionnaire_id} className="border-border/40">
                                    <TableCell className="font-medium">{q.title}</TableCell>
                                    <TableCell className="text-muted-foreground font-mono text-xs">
                                        {q.slug}
                                    </TableCell>
                                    <TableCell>{q.steps.length}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                q.status === TemplateStatus.PUBLISHED ? "default" : "secondary"
                                            }
                                        >
                                            {q.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(q.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => onEdit(q)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onPreview(q)}>
                                                        <Eye className="mr-2 h-4 w-4" /> Preview
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => {
                                                            if (confirm("Are you sure you want to delete this questionnaire?")) {
                                                                onDelete(q.questionnaire_id);
                                                            }
                                                        }}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
