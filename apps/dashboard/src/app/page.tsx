"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  Button,
  Spinner,
} from "@heroui/react";
import { fetchLeads } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, new: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetchLeads({ limit: 100 });
        setStats({
          total: response.total,
          new: response.leads.filter((l) => l.status === "new").length,
        });
      } catch {
        // Silently fail for homepage stats
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-background to-emerald-50 dark:from-green-950/20 dark:via-background dark:to-emerald-950/20" />

        {/* Decorative circles */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-green-200/30 to-emerald-300/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-200/30 to-green-300/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Logo and Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 shadow-2xl shadow-green-500/30 mb-6">
              <span className="text-4xl">🥦</span>
            </div>
            <h1 className="text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              Broccoli
            </h1>
            <p className="text-xl text-foreground-500 max-w-2xl mx-auto">
              Intelligent lead processing powered by AI. Transform emails into
              actionable leads automatically.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 mb-12">
            {isLoading ? (
              <Spinner color="primary" />
            ) : (
              <>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">{stats.total}</p>
                  <p className="text-sm text-foreground-400">Total Leads</p>
                </div>
                <div className="w-px bg-divider" />
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-500">{stats.new}</p>
                  <p className="text-sm text-foreground-400">New Today</p>
                </div>
              </>
            )}
          </div>

          {/* CTA */}
          <div className="flex justify-center">
            <Button
              color="primary"
              size="lg"
              className="font-semibold shadow-lg shadow-primary/25"
              onClick={() => router.push("/leads")}
            >
              View All Leads →
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center text-foreground mb-12">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-divider shadow-sm hover:shadow-md transition-shadow">
            <CardBody className="p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <span className="text-2xl">📧</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Email Ingestion
              </h3>
              <p className="text-foreground-500 text-sm">
                Incoming emails are received via AgentMail webhooks and
                immediately queued for processing.
              </p>
            </CardBody>
          </Card>

          <Card className="border border-divider shadow-sm hover:shadow-md transition-shadow">
            <CardBody className="p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                AI Extraction
              </h3>
              <p className="text-foreground-500 text-sm">
                OpenAI analyzes email content to extract customer details,
                contact info, and service requests.
              </p>
            </CardBody>
          </Card>

          <Card className="border border-divider shadow-sm hover:shadow-md transition-shadow">
            <CardBody className="p-6">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Lead Management
              </h3>
              <p className="text-foreground-500 text-sm">
                Track lead status, manage follow-ups, and convert prospects into
                customers—all from one dashboard.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Architecture Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
        <Card className="border border-divider bg-gradient-to-br from-default-50 to-background">
          <CardBody className="p-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
              System Architecture
            </h3>
            <div className="flex items-center justify-center gap-4 flex-wrap text-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">📬</span>
                <span className="text-sm font-medium">AgentMail</span>
              </div>
              <span className="text-foreground-300">→</span>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔧</span>
                <span className="text-sm font-medium">NestJS Backend</span>
              </div>
              <span className="text-foreground-300">→</span>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <span className="text-sm font-medium">Temporal</span>
              </div>
              <span className="text-foreground-300">→</span>
              <div className="flex items-center gap-2">
                <span className="text-xl">🗄️</span>
                <span className="text-sm font-medium">PostgreSQL</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
