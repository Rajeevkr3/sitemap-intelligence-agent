"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { GraphTopology } from "@/lib/api";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => (
        <div className="h-[500px] w-full bg-slate-950 rounded-xl flex items-center justify-center text-slate-400 text-xs">
            Loading graph canvas...
        </div>
    )
});

interface Props {
    data: GraphTopology;
}

export default function NetworkGraph({ data }: Props) {
    const [mounted, setMounted] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            const container = document.getElementById("graph-container");
            if (container) {
                setDimensions({
                    width: container.clientWidth,
                    height: 500,
                });
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    if (!mounted) {
        return (
            <div id="graph-container" className="w-full h-[500px] bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center text-slate-400 text-xs">
                Initializing Graph Visualizer...
            </div>
        );
    }

    const formattedData = {
        nodes: data.nodes.map((n) => ({
            id: n.id,
            name: n.label,
            val: Math.max(n.inDegree * 1.5, 3),
            color: n.isOrphan ? "#ef4444" : n.pageRank > 0.05 ? "#10b981" : "#3b82f6",
        })),
        links: data.edges.map((e) => ({
            source: e.source,
            target: e.target,
        })),
    };

    return (
        <div id="graph-container" className="w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative">
            <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1 pointer-events-none">
                <div className="font-semibold text-slate-200">Graph Legend</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Standard Node</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> High Centrality / PageRank</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Orphan Node</div>
            </div>
            <ForceGraph2D
                width={dimensions.width}
                height={dimensions.height}
                graphData={formattedData}
                nodeLabel={(node: any) => `${node.name}\n(${node.id})`}
                nodeColor={(node: any) => node.color}
                linkColor={() => "#475569"}
                linkDirectionalArrowLength={4}
                linkDirectionalArrowRelPos={1}
            />
        </div>
    );
}