"use client";

import React, { useMemo } from "react";
import { GraphTopology } from "@/lib/api";

interface Props {
    data: GraphTopology;
}

export default function NetworkGraph({ data }: Props) {
    const width = 800;
    const height = 480;
    const centerX = width / 2;
    const centerY = height / 2;

    // Compute layout positions using deterministic circular topology with degree offsets
    const { layoutNodes, layoutEdges } = useMemo(() => {
        const rawNodes = data?.nodes || [];
        const rawEdges = data?.edges || [];
        const count = rawNodes.length;

        if (count === 0) {
            return { layoutNodes: [], layoutEdges: [] };
        }

        const radius = Math.min(centerX, centerY) - 80;
        const nodeMap = new Map();

        const computedNodes = rawNodes.map((node, index) => {
            // Root or highest centrality node gets placed near center
            const isCentral = node.inDegree > 5 || node.pageRank > 0.05;
            const angle = (index / count) * 2 * Math.PI;
            const r = isCentral ? radius * 0.45 : radius;

            const x = Math.round(centerX + r * Math.cos(angle));
            const y = Math.round(centerY + r * Math.sin(angle));
            const nodeRadius = Math.max(Math.min(node.inDegree * 1.5 + 8, 22), 8);

            const nodeObj = {
                ...node,
                x,
                y,
                radius: nodeRadius,
                displayLabel: (node.label || node.id).replace(/^https?:\/\/[^/]+/, "") || "/",
            };

            nodeMap.set(node.id, nodeObj);
            return nodeObj;
        });

        const computedEdges = rawEdges
            .map((edge) => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (!source || !target) return null;
                return { source, target };
            })
            .filter(Boolean);

        return { layoutNodes: computedNodes, layoutEdges: computedEdges };
    }, [data, centerX, centerY]);

    if (!data || !data.nodes || data.nodes.length === 0) {
        return (
            <div className="w-full h-[480px] bg-slate-950 rounded-xl flex items-center justify-center text-slate-400 text-sm border border-slate-800">
                No topology nodes discovered for this audit job.
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative shadow-inner">
            {/* Legend Badge */}
            <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1 pointer-events-none">
                <div className="font-semibold text-slate-200">Graph Legend</div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Standard Page
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> High Centrality / PageRank
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Orphan Node
                </div>
            </div>

            {/* Responsive SVG Canvas */}
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-[480px] block"
                style={{ background: "#020617" }}
            >
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="7"
                        markerHeight="7"
                        refX="6"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 7 3.5, 0 7" fill="#64748b" />
                    </marker>
                </defs>

                {/* Directed Link Edges */}
                <g stroke="#334155" strokeWidth="1.2" strokeOpacity="0.6">
                    {layoutEdges.map((edge: any, i: number) => (
                        <line
                            key={`edge-${i}`}
                            x1={edge.source.x}
                            y1={edge.source.y}
                            x2={edge.target.x}
                            y2={edge.target.y}
                            markerEnd="url(#arrowhead)"
                        />
                    ))}
                </g>

                {/* Graph Vertices */}
                <g>
                    {layoutNodes.map((node: any) => {
                        const fillColor = node.isOrphan
                            ? "#f43f5e"
                            : node.pageRank > 0.05 || node.inDegree > 8
                                ? "#10b981"
                                : "#3b82f6";

                        return (
                            <g key={node.id} className="cursor-pointer group">
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={node.radius}
                                    fill={fillColor}
                                    stroke="#ffffff"
                                    strokeWidth="1.5"
                                    className="transition-transform duration-200 hover:scale-125"
                                >
                                    <title>{`${node.label}\nURL: ${node.id}\nIn-Degree: ${node.inDegree}\nPageRank: ${node.pageRank}`}</title>
                                </circle>
                                <text
                                    x={node.x}
                                    y={node.y + node.radius + 12}
                                    textAnchor="middle"
                                    fill="#94a3b8"
                                    fontSize="10"
                                    fontFamily="monospace"
                                    className="pointer-events-none select-none"
                                >
                                    {node.displayLabel.length > 18
                                        ? node.displayLabel.slice(0, 18) + "…"
                                        : node.displayLabel}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}