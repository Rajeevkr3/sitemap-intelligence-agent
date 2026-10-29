"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { GraphTopology } from "@/lib/api";

interface Props {
    data: GraphTopology;
}

interface RenderNode {
    id: string;
    label: string;
    pageRank: number;
    inDegree: number;
    isOrphan: boolean;
    x: number;
    y: number;
    radius: number;
    displayLabel: string;
    textAnchor: "start" | "middle" | "end";
    textX: number;
    textY: number;
}

export default function NetworkGraph({ data }: Props) {
    const width = 850;
    const height = 520;
    const centerX = width / 2;
    const centerY = height / 2;

    // Local state for draggable node coordinates
    const [nodes, setNodes] = useState<RenderNode[]>([]);
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const hasMovedRef = useRef<boolean>(false);

    // Initialize node layout with dynamic radial text projection
    useEffect(() => {
        const rawNodes = data?.nodes || [];
        const count = rawNodes.length;
        if (count === 0) {
            setNodes([]);
            return;
        }

        const baseRadius = Math.min(centerX, centerY) - 100;

        const initialNodes: RenderNode[] = rawNodes.map((node, index) => {
            const isCentral = node.inDegree > 8 || node.pageRank > 0.08;
            const angle = (index / count) * 2 * Math.PI;
            const r = isCentral ? baseRadius * 0.35 : baseRadius;

            const x = Math.round(centerX + r * Math.cos(angle));
            const y = Math.round(centerY + r * Math.sin(angle));
            const nodeRadius = Math.max(Math.min(node.inDegree * 1.5 + 8, 22), 8);

            // Radial label offset calculation
            const labelDistance = nodeRadius + 14;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            // Determine horizontal alignment based on hemisphere
            let textAnchor: "start" | "middle" | "end" = "middle";
            if (cosA > 0.25) textAnchor = "start";
            else if (cosA < -0.25) textAnchor = "end";

            const textX = x + labelDistance * cosA;
            // Slight vertical baseline adjustment
            const textY = y + labelDistance * sinA + (sinA > 0.3 ? 4 : sinA < -0.3 ? -2 : 3);

            const pathOnly = (node.label || node.id).replace(/^https?:\/\/[^/]+/, "");
            const displayLabel = pathOnly.length > 0 ? pathOnly : "/";

            return {
                ...node,
                x,
                y,
                radius: nodeRadius,
                displayLabel,
                textAnchor,
                textX,
                textY,
            };
        });

        setNodes(initialNodes);
    }, [data, centerX, centerY]);

    // Map of active nodes for fast edge coordinate lookup
    const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

    // Filter valid linkages
    const edges = useMemo(() => {
        return (data?.edges || [])
            .map((e) => {
                const source = nodeMap.get(e.source);
                const target = nodeMap.get(e.target);
                if (!source || !target) return null;
                return { source, target };
            })
            .filter(Boolean) as { source: RenderNode; target: RenderNode }[];
    }, [data?.edges, nodeMap]);

    // Drag Event Handlers
    const handleMouseDown = (e: React.MouseEvent, node: RenderNode) => {
        e.stopPropagation();
        setDraggingNodeId(node.id);
        hasMovedRef.current = false;
        dragOffsetRef.current = {
            x: e.clientX - node.x,
            y: e.clientY - node.y,
        };
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!draggingNodeId) return;
        hasMovedRef.current = true;

        const svgRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const mouseY = e.clientY - svgRect.top;

        // Scale to viewBox coordinates
        const scaleX = width / svgRect.width;
        const scaleY = height / svgRect.height;
        const currentX = mouseX * scaleX;
        const currentY = mouseY * scaleY;

        setNodes((prev) =>
            prev.map((n) => {
                if (n.id !== draggingNodeId) return n;

                // Recalculate radial vector relative to canvas center
                const angle = Math.atan2(currentY - centerY, currentX - centerX);
                const labelDistance = n.radius + 14;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);

                let textAnchor: "start" | "middle" | "end" = "middle";
                if (cosA > 0.25) textAnchor = "start";
                else if (cosA < -0.25) textAnchor = "end";

                return {
                    ...n,
                    x: currentX,
                    y: currentY,
                    textX: currentX + labelDistance * cosA,
                    textY: currentY + labelDistance * sinA + (sinA > 0.3 ? 4 : sinA < -0.3 ? -2 : 3),
                    textAnchor,
                };
            })
        );
    };

    const handleMouseUp = () => {
        setDraggingNodeId(null);
    };

    const handleNodeClick = (url: string) => {
        // Only open if the user clicked without dragging
        if (!hasMovedRef.current) {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    };

    if (!data || !data.nodes || data.nodes.length === 0) {
        return (
            <div className="w-full h-[520px] bg-slate-950 rounded-xl flex items-center justify-center text-slate-400 text-sm border border-slate-800">
                No topology nodes discovered for this crawl job.
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative shadow-inner select-none">
            {/* Legend & Instructions Badge */}
            <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur px-3 py-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1.5 pointer-events-none">
                <div className="font-semibold text-slate-200">Interactive Graph Controls</div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Standard Node
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> High PageRank Centrality
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Orphan Defect Node
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    • <span className="text-slate-200">Drag</span> nodes to rearrange
                    <br />• <span className="text-slate-200">Click</span> node to open page in new tab
                </div>
            </div>

            {/* Interactive SVG Canvas */}
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-[520px] block cursor-grab active:cursor-grabbing"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
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
                <g stroke="#334155" strokeWidth="1.2" strokeOpacity="0.5">
                    {edges.map((edge, i) => (
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
                    {nodes.map((node) => {
                        const fillColor = node.isOrphan
                            ? "#f43f5e"
                            : node.pageRank > 0.05 || node.inDegree > 8
                                ? "#10b981"
                                : "#3b82f6";

                        return (
                            <g
                                key={node.id}
                                className="cursor-pointer"
                                onMouseDown={(e) => handleMouseDown(e, node)}
                                onClick={() => handleNodeClick(node.id)}
                            >
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={node.radius}
                                    fill={fillColor}
                                    stroke="#ffffff"
                                    strokeWidth="1.8"
                                    className="transition-transform duration-150 hover:opacity-90"
                                >
                                    <title>{`${node.label}\nURL: ${node.id}\nIn-Degree: ${node.inDegree}\nPageRank: ${node.pageRank.toFixed(6)}\n(Click to open URL)`}</title>
                                </circle>

                                {/* Radially Projected Label */}
                                <text
                                    x={node.textX}
                                    y={node.textY}
                                    textAnchor={node.textAnchor}
                                    fill="#94a3b8"
                                    fontSize="11"
                                    fontFamily="monospace"
                                    className="pointer-events-none select-none font-medium"
                                >
                                    {node.displayLabel.length > 22
                                        ? node.displayLabel.slice(0, 22) + "…"
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