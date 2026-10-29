"use client";

import React, { useRef, useEffect } from "react";
import { GraphTopology } from "@/lib/api";

interface Props {
    data: GraphTopology;
}

export default function NetworkGraph({ data }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
        const height = (canvas.height = 500);

        // Initial node positioning in a circle
        const nodeCount = data.nodes.length || 1;
        const nodes = data.nodes.map((n, i) => {
            const angle = (i / nodeCount) * 2 * Math.PI;
            const radius = Math.min(width, height) * 0.35;
            return {
                ...n,
                x: width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
                y: height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
                vx: 0,
                vy: 0,
                radius: Math.max(Math.min(n.inDegree * 1.5 + 6, 20), 6),
            };
        });

        const nodeMap = new Map(nodes.map((n) => [n.id, n]));

        // Simple spring simulation loop
        const render = () => {
            // Repulsion between nodes
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[j].x - nodes[i].x;
                    const dy = nodes[j].y - nodes[i].y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    if (dist < 180) {
                        const force = (180 - dist) / dist * 0.04;
                        nodes[i].vx -= dx * force;
                        nodes[i].vy -= dy * force;
                        nodes[j].vx += dx * force;
                        nodes[j].vy += dy * force;
                    }
                }
            }

            // Attraction along edges
            data.edges.forEach((edge) => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (source && target) {
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (dist - 100) * 0.005;
                    source.vx += dx * force;
                    source.vy += dy * force;
                    target.vx -= dx * force;
                    target.vy -= dy * force;
                }
            });

            // Gravity to center & position update
            nodes.forEach((n) => {
                n.vx += (width / 2 - n.x) * 0.002;
                n.vy += (height / 2 - n.y) * 0.002;
                n.vx *= 0.88; // Damping
                n.vy *= 0.88;
                n.x += n.vx;
                n.y += n.vy;
            });

            // Draw frame
            ctx.clearRect(0, 0, width, height);

            // Draw directed edges
            data.edges.forEach((edge) => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (source && target) {
                    ctx.beginPath();
                    ctx.moveTo(source.x, source.y);
                    ctx.lineTo(target.x, target.y);
                    ctx.strokeStyle = "rgba(71, 85, 105, 0.4)";
                    ctx.lineWidth = 1.2;
                    ctx.stroke();

                    // Arrow head
                    const angle = Math.atan2(target.y - source.y, target.x - source.x);
                    const arrowLen = 8;
                    const toX = target.x - Math.cos(angle) * (target.radius + 2);
                    const toY = target.y - Math.sin(angle) * (target.radius + 2);

                    ctx.beginPath();
                    ctx.moveTo(toX, toY);
                    ctx.lineTo(
                        toX - arrowLen * Math.cos(angle - Math.PI / 6),
                        toY - arrowLen * Math.sin(angle - Math.PI / 6)
                    );
                    ctx.lineTo(
                        toX - arrowLen * Math.cos(angle + Math.PI / 6),
                        toY - arrowLen * Math.sin(angle + Math.PI / 6)
                    );
                    ctx.fillStyle = "rgba(100, 116, 139, 0.7)";
                    ctx.fill();
                }
            });

            // Draw nodes
            nodes.forEach((n) => {
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);
                ctx.fillStyle = n.isOrphan ? "#ef4444" : n.pageRank > 0.05 ? "#10b981" : "#3b82f6";
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Node label
                ctx.font = "10px sans-serif";
                ctx.fillStyle = "#cbd5e1";
                const shortName = n.label.length > 20 ? n.label.substring(0, 20) + "..." : n.label;
                ctx.fillText(shortName, n.x + n.radius + 4, n.y + 3);
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [data]);

    return (
        <div className="w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative">
            <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1 pointer-events-none">
                <div className="font-semibold text-slate-200">Graph Legend</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Standard Node</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> High Centrality / PageRank</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Orphan Node</div>
            </div>
            <canvas ref={canvasRef} className="w-full h-[500px] block" />
        </div>
    );
}