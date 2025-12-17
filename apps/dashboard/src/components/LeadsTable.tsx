"use client";

import { useState, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Spinner,
  Pagination,
  Tooltip,
} from "@heroui/react";
import type { Lead, LeadStatus } from "@broccoli/contracts";
import { updateLeadStatus } from "@/lib/api";

const STATUS_CONFIG: Record<
  LeadStatus,
  { color: "default" | "primary" | "secondary" | "success" | "warning" | "danger"; label: string }
> = {
  new: { color: "primary", label: "New" },
  contacted: { color: "secondary", label: "Contacted" },
  qualified: { color: "warning", label: "Qualified" },
  converted: { color: "success", label: "Converted" },
  lost: { color: "danger", label: "Lost" },
  archived: { color: "default", label: "Archived" },
};

const CHANNEL_ICONS: Record<string, string> = {
  email: "✉️",
  sms: "💬",
  whatsapp: "📱",
  phone: "📞",
  web: "🌐",
  other: "📋",
};

interface LeadsTableProps {
  initialLeads: Lead[];
  total: number;
  limit: number;
  offset: number;
  onPageChange?: (page: number) => void;
  onStatusFilter?: (status: LeadStatus | undefined) => void;
  selectedStatus?: LeadStatus;
}

export function LeadsTable({
  initialLeads,
  total,
  limit,
  offset,
  onPageChange,
  onStatusFilter,
  selectedStatus,
}: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const handleStatusChange = useCallback(
    async (leadId: string, newStatus: LeadStatus) => {
      setUpdatingId(leadId);
      try {
        const updatedLead = await updateLeadStatus(leadId, newStatus);
        setLeads((prev) =>
          prev.map((lead) => (lead.id === leadId ? updatedLead : lead))
        );
      } catch (error) {
        console.error("Failed to update status:", error);
      } finally {
        setUpdatingId(null);
      }
    },
    []
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const columns = [
    { key: "customer", label: "Customer" },
    { key: "channel", label: "Channel" },
    { key: "provider", label: "Source" },
    { key: "status", label: "Status" },
    { key: "error", label: "Error" },
    { key: "created", label: "Created" },
  ];

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-foreground-500">Filter by status:</span>
        <div className="flex gap-1 flex-wrap">
          <Chip
            className="cursor-pointer transition-transform hover:scale-105"
            color={selectedStatus === undefined ? "primary" : "default"}
            variant={selectedStatus === undefined ? "solid" : "flat"}
            onClick={() => onStatusFilter?.(undefined)}
          >
            All ({total})
          </Chip>
          {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => (
            <Chip
              key={status}
              className="cursor-pointer transition-transform hover:scale-105"
              color={selectedStatus === status ? STATUS_CONFIG[status].color : "default"}
              variant={selectedStatus === status ? "solid" : "flat"}
              onClick={() => onStatusFilter?.(status)}
            >
              {STATUS_CONFIG[status].label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Table */}
      <Table
        aria-label="Leads table"
        classNames={{
          wrapper: "shadow-sm border border-divider rounded-xl",
          th: "bg-default-100 text-foreground-600 uppercase text-xs tracking-wider",
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={leads}
          emptyContent={
            <div className="py-12 text-center">
              <p className="text-foreground-400 text-lg">No leads found</p>
              <p className="text-foreground-300 text-sm mt-1">
                Leads will appear here when they are processed
              </p>
            </div>
          }
        >
          {(lead) => (
            <TableRow key={lead.id} className="hover:bg-default-50 transition-colors">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {lead.customer_name || "Unknown Customer"}
                  </span>
                  {lead.customer_number && (
                    <span className="text-xs text-foreground-400">
                      {lead.customer_number}
                    </span>
                  )}
                  {lead.customer_address && (
                    <Tooltip content={lead.customer_address}>
                      <span className="text-xs text-foreground-400 truncate max-w-[200px]">
                        {lead.customer_address}
                      </span>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Tooltip content={lead.chat_channel || "email"}>
                  <span className="text-xl">
                    {CHANNEL_ICONS[lead.chat_channel || "email"]}
                  </span>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" className="capitalize">
                  {lead.provider}
                </Chip>
              </TableCell>
              <TableCell>
                {updatingId === lead.id ? (
                  <Spinner size="sm" />
                ) : (
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        variant="flat"
                        size="sm"
                        className="min-w-[100px]"
                        color={STATUS_CONFIG[lead.status].color}
                      >
                        {STATUS_CONFIG[lead.status].label}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Change status"
                      onAction={(key) =>
                        handleStatusChange(lead.id, key as LeadStatus)
                      }
                    >
                      {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map(
                        (status) => (
                          <DropdownItem
                            key={status}
                            className={
                              lead.status === status
                                ? "bg-primary-50 text-primary"
                                : ""
                            }
                          >
                            <div className="flex items-center gap-2">
                              <Chip
                                size="sm"
                                color={STATUS_CONFIG[status].color}
                                variant="dot"
                              >
                                {STATUS_CONFIG[status].label}
                              </Chip>
                            </div>
                          </DropdownItem>
                        )
                      )}
                    </DropdownMenu>
                  </Dropdown>
                )}
              </TableCell>
              <TableCell>
                {lead.processing_error ? (
                  <Tooltip content={lead.processing_error}>
                    <Chip
                      size="sm"
                      color="danger"
                      variant="flat"
                      startContent={<span>⚠️</span>}
                    >
                      Error
                    </Chip>
                  </Tooltip>
                ) : (
                  <Chip size="sm" color="success" variant="flat" startContent={<span>✓</span>}>
                    OK
                  </Chip>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-foreground-500">
                  {formatDate(lead.created_at)}
                </span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground-400">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}{" "}
            leads
          </span>
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={onPageChange}
            showControls
            classNames={{
              cursor: "bg-primary shadow-primary/30",
            }}
          />
        </div>
      )}
    </div>
  );
}

