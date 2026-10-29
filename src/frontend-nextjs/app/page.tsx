"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  createAuditJob,
  fetchAuditJob,
  fetchCrawledPages,
  fetchAuditIssues,
  fetchGraphTopology,
  AuditJobDetail,
  CrawledPage,
  AuditIssue,
  GraphTopology,
} from "@/lib/api";
import {
  Globe,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Share2,
  Layers,
  GitFork,
} from "lucide-react";

// Dynamically import NetworkGraph with SSR disabled to safeguard HTML5 Canvas contexts
const NetworkGraph = dynamic(() => import("@/components/NetworkGraph"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-slate-950 rounded-xl flex items-center justify-center text-slate-400 text-sm">
      Initializing Topology Graph Canvas...
    </div>
  ),
});

export default function DashboardPage() {
  // Input Controls
  const [targetUrl, setTargetUrl] = useState<string>("https://books.toscrape.com");
  const [maxDepth, setMaxDepth] = useState<number>(2);
  const [maxPages, setMaxPages] = useState<number>(15);

  // Active Job State (Defaults to latest validated audit execution)
  const [activeJobId, setActiveJobId] = useState<string>("49609bc0-65c3-426e-8c35-5d58d6b8f284");
  const [jobDetail, setJobDetail] = useState<AuditJobDetail | null>(null);

  // Audit Ingestion Collections
  const [pages, setPages] = useState<CrawledPage[]>([]);
  const [issues, setIssues] = useState<AuditIssue[]>([]);
  const [graphData, setGraphData] = useState<GraphTopology | null>(null);

  // UI Control State
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"graph" | "pages" | "issues">("graph");

  /**
   * Fetches job metadata, topological vertices, defect logs, and graph linkages.
   */
  const loadJobData = async (jobId: string) => {
    try {
      const job = await fetchAuditJob(jobId);
      setJobDetail(job);
    } catch (err) {
      console.error("Error fetching job details:", err);
    }

    try {
      const fetchedPages = await fetchCrawledPages(jobId);
      setPages(fetchedPages);
    } catch (err) {
      console.error("Error fetching crawled pages:", err);
    }

    try {
      const fetchedIssues = await fetchAuditIssues(jobId);
      setIssues(fetchedIssues);
    } catch (err) {
      console.error("Error fetching audit issues:", err);
    }

    try {
      const fetchedGraph = await fetchGraphTopology(jobId);
      setGraphData(fetchedGraph);
    } catch (err) {
      console.error("Error fetching graph topology:", err);
    }
  };

  /**
   * Lifecycle trigger: Polls the backend API while an audit job is in an active state.
   */
  useEffect(() => {
    if (!activeJobId) return;
    loadJobData(activeJobId);

    const interval = setInterval(() => {
      if (jobDetail?.status === "PENDING" || jobDetail?.status === "RUNNING") {
        loadJobData(activeJobId);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeJobId, jobDetail?.status]);

  /**
   * Dispatches a new audit request to the ASP.NET Core CQRS command pipeline.
   */
  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { jobId } = await createAuditJob(targetUrl, maxDepth, maxPages);
      setActiveJobId(jobId);
      setJobDetail(null);
      setPages([]);
      setIssues([]);
      setGraphData(null);
      setActiveTab("graph");
    } catch (err) {
      alert("Failed to initialize audit job. Ensure the ASP.NET Core API is running on port 5132.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Global Application Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 text-white p-2 rounded-lg">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SiteMap Intelligence Agent</h1>
              <p className="text-xs text-slate-500 font-medium">Topological & Semantic Graph Auditor</p>
            </div>
          </div>
          {jobDetail && (
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider">
              <span
                className={`px-3 py-1 rounded-full ${jobDetail.status === "COMPLETED"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                  }`}
              >
                {jobDetail.status}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Audit Dispatch Control Panel */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-slate-700" />
            Configure New Audit
          </h2>
          <form onSubmit={handleStartAudit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Web URL</label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="url"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max Depth (BFS)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? "Queuing..." : "Start Full Audit"}
              </button>
            </div>
          </form>
        </section>

        {/* Aggregate KPI Metric Cards */}
        {jobDetail && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>PAGES CRAWLED</span>
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold mt-2 text-slate-900">{jobDetail.totalPagesCrawled}</div>
              <p className="text-xs text-slate-400 mt-1">Domain: {jobDetail.rootDomain}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>DEFECTS IDENTIFIED</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold mt-2 text-slate-900">{jobDetail.totalIssuesFound}</div>
              <p className="text-xs text-slate-400 mt-1">Orphans & Duplicates</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>START TIME</span>
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-sm font-semibold mt-3 text-slate-800">
                {new Date(jobDetail.createdAt).toLocaleTimeString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">{new Date(jobDetail.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>EXECUTION STATUS</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-sm font-semibold mt-3 text-emerald-700">
                {jobDetail.completedAt ? "Pipeline Finished" : "Worker Processing"}
              </div>
              <p className="text-xs text-slate-400 mt-1">ID: {jobDetail.id.slice(0, 8)}...</p>
            </div>
          </section>
        )}

        {/* Tabbed Inspection Canvas */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-3">
            <button
              onClick={() => setActiveTab("graph")}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "graph"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <GitFork className="w-4 h-4" />
              Visual Graph Topology
            </button>
            <button
              onClick={() => setActiveTab("pages")}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "pages"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <FileText className="w-4 h-4" />
              Crawled Pages & Centrality ({pages.length})
            </button>
            <button
              onClick={() => setActiveTab("issues")}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "issues"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Audit Issues & Findings ({issues.length})
            </button>
          </div>

          <div className="p-6">
            {/* View 1: 2D Interactive Force-Directed Canvas */}
            {activeTab === "graph" && (
              <div>
                {graphData && graphData.nodes.length > 0 ? (
                  <NetworkGraph data={graphData} />
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-400 text-sm border border-dashed border-slate-300 rounded-xl">
                    No graph linkages available for this audit run.
                  </div>
                )}
              </div>
            )}

            {/* View 2: Tabular Centrality & Page Details */}
            {activeTab === "pages" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">URL</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Depth</th>
                      <th className="py-3 px-4">In-Degree</th>
                      <th className="py-3 px-4">Out-Degree</th>
                      <th className="py-3 px-4">PageRank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pages.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono text-slate-900 truncate max-w-xs" title={p.url}>
                          {p.url}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                            {p.httpStatusCode || 200}
                          </span>
                        </td>
                        <td className="py-3 px-4">{p.crawlDepth}</td>
                        <td className="py-3 px-4 font-semibold">{p.inDegree}</td>
                        <td className="py-3 px-4">{p.outDegree}</td>
                        <td className="py-3 px-4 font-mono">{p.pageRankScore.toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* View 3: Flagged Defects & Near-Duplicate Items */}
            {activeTab === "issues" && (
              <div className="space-y-3">
                {issues.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4">No defects identified for this crawl job.</p>
                ) : (
                  issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3"
                    >
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">{issue.issueType}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-red-100 text-red-800 rounded">
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{issue.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}