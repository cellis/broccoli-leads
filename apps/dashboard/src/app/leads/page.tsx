"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Button,
} from "@heroui/react";
import type { Lead, LeadStatus } from "@broccoli/contracts";
import { LeadsTable } from "@/components/LeadsTable";
import { fetchLeads } from "@/lib/api";

const ITEMS_PER_PAGE = 10;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchLeads({
        status: statusFilter,
        limit: ITEMS_PER_PAGE,
        offset,
      });
      setLeads(response.leads);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, offset]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handlePageChange = (page: number) => {
    setOffset((page - 1) * ITEMS_PER_PAGE);
  };

  const handleStatusFilter = (status: LeadStatus | undefined) => {
    setStatusFilter(status);
    setOffset(0);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-divider bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                <span className="text-white text-xl">🥦</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Broccoli</h1>
                <p className="text-xs text-foreground-400">Lead Management</p>
              </div>
            </div>
            <Button
              color="primary"
              variant="flat"
              size="sm"
              onClick={loadLeads}
              isLoading={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border border-divider shadow-sm">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-lg">📊</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{total}</p>
                  <p className="text-xs text-foreground-400">Total Leads</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-divider shadow-sm">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-500 text-lg">🆕</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {leads.filter((l) => l.status === "new").length}
                  </p>
                  <p className="text-xs text-foreground-400">New</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-divider shadow-sm">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <span className="text-warning text-lg">⏳</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {leads.filter((l) => l.status === "qualified").length}
                  </p>
                  <p className="text-xs text-foreground-400">Qualified</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-divider shadow-sm">
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <span className="text-success text-lg">✅</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {leads.filter((l) => l.status === "converted").length}
                  </p>
                  <p className="text-xs text-foreground-400">Converted</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Leads Table */}
        <Card className="border border-divider shadow-sm">
          <CardHeader className="border-b border-divider bg-default-50">
            <div className="flex items-center justify-between w-full">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Leads</h2>
                <p className="text-sm text-foreground-400">
                  Manage and track your incoming leads
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0 overflow-hidden">
            {isLoading && leads.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" color="primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-danger text-lg mb-4">{error}</p>
                <Button color="primary" onClick={loadLeads}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="p-4">
                <LeadsTable
                  initialLeads={leads}
                  total={total}
                  limit={ITEMS_PER_PAGE}
                  offset={offset}
                  onPageChange={handlePageChange}
                  onStatusFilter={handleStatusFilter}
                  selectedStatus={statusFilter}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </main>
    </div>
  );
}

