import { useState, useMemo } from 'react';
import { hierarchy, tree } from 'd3-hierarchy';

/**
 * Standalone Mind Map Component
 * Just pass JSON data and it renders an interactive, scrollable mind map
 * 
 * Usage:
 * <MindMap data={yourJsonData} />
 */

// Helper functions
function normalizeTree(input) {
    if (!input || typeof input !== 'object') return null;
    let auto = 0;
    const walk = (node) => {
        if (!node || typeof node !== 'object') return null;
        const id = node.id ?? `auto_${auto++}`;
        const label = node.label ?? node.name ?? String(id);
        const raw = Array.isArray(node.children) ? node.children : [];
        const children = raw.map(walk).filter((c) => c && c.id);
        return { id, label, children };
    };
    return walk(input);
}

function collectExpandableIds(node, set) {
    if (!node) return set;
    if (node.children?.length) set.add(node.id);
    node.children?.forEach((c) => collectExpandableIds(c, set));
    return set;
}

function buildVisibleTree(node, expanded) {
    if (!node) return null;
    const kids = Array.isArray(node.children) ? node.children.filter((c) => c && c.id) : [];
    if (!kids.length) return { ...node, children: [] };
    if (!expanded.has(node.id)) return { ...node, children: [] };
    return {
        ...node,
        children: kids.map((c) => buildVisibleTree(c, expanded)).filter(Boolean),
    };
}

function diagonal(s, t) {
    const midX = (s.x + t.x) / 2;
    return `M ${s.x} ${s.y} C ${midX} ${s.y}, ${midX} ${t.y}, ${t.x} ${t.y}`;
}

const MindMap = ({
    data,
    nodeSpacing = { x: 360, y: 120 },
    animationDuration = 260,
    padding = 60,
    colors = {
        root: { fill: '#b9c7ff', stroke: '#6f86ff' },
        branch: { fill: '#bfe3ff', stroke: '#6aa6d9' },
        leaf: { fill: '#bff5d0', stroke: '#6aa6d9' },
        link: '#b7c5dd',
    },
    nodeRadius = 7,
    nodeLabelGap = 14,
    onNodeClick = null,
    onNodeExpand = null,
    className = '',
    style = {},
}) => {
    const safeData = useMemo(() => normalizeTree(data), [data]);
    const [expanded, setExpanded] = useState(() => new Set());

    const expandableIds = useMemo(() => {
        if (!safeData) return new Set();
        return collectExpandableIds(safeData, new Set());
    }, [safeData]);

    const visibleData = useMemo(() => {
        if (!safeData) return null;
        return buildVisibleTree(safeData, expanded);
    }, [safeData, expanded]);

    const layout = useMemo(() => {
        if (!visibleData) {
            return { nodes: [], links: [], bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 600 } };
        }

        const root = hierarchy(visibleData);
        const layoutFn = tree().nodeSize([nodeSpacing.y, nodeSpacing.x]);
        const t = layoutFn(root);

        const dn = t.descendants();
        const lk = t.links();

        const LABEL_X = nodeRadius + nodeLabelGap;

        const nodes = dn.map((n) => {
            const label = n.data.label ?? n.data.id;
            const paddingX = 14;
            const paddingY = 10;
            const textW = Math.min(640, Math.max(90, String(label).length * 7.2));
            const boxW = textW + paddingX * 2;
            const boxH = 34 + paddingY;

            return {
                id: n.data.id,
                label,
                x: n.y,
                y: n.x,
                depth: n.depth,
                hasChildren: expandableIds.has(n.data.id),
                boxW,
                boxH,
            };
        });

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        for (const n of nodes) {
            const left = n.x;
            const right = n.x + LABEL_X + n.boxW;
            const top = n.y - n.boxH / 2;
            const bottom = n.y + n.boxH / 2;

            minX = Math.min(minX, left);
            maxX = Math.max(maxX, right);
            minY = Math.min(minY, top);
            maxY = Math.max(maxY, bottom);
        }

        const shiftX = padding - minX;
        const shiftY = padding - minY;

        const shiftedNodes = nodes.map((n) => ({
            ...n,
            x: n.x + shiftX,
            y: n.y + shiftY,
        }));

        const byId = new Map(shiftedNodes.map((n) => [n.id, n]));

        const links = lk.map((l) => {
            const s = byId.get(l.source.data.id);
            const tnode = byId.get(l.target.data.id);

            const sAttach = { x: s.x + LABEL_X + s.boxW, y: s.y };
            const tAttach = { x: tnode.x + LABEL_X, y: tnode.y };

            return {
                id: `${s.id}__${tnode.id}`,
                source: sAttach,
                target: tAttach,
            };
        });

        const bounds = {
            minX: padding,
            minY: padding,
            maxX: maxX + shiftX + padding,
            maxY: maxY + shiftY + padding,
        };

        return { nodes: shiftedNodes, links, bounds };
    }, [visibleData, expandableIds, nodeSpacing, padding, nodeRadius, nodeLabelGap]);

    const toggle = (id) => {
        if (!expandableIds.has(id)) return;

        setExpanded((prev) => {
            const next = new Set(prev);
            const wasExpanded = next.has(id);

            if (wasExpanded) {
                next.delete(id);
            } else {
                next.add(id);
            }

            if (onNodeExpand) {
                onNodeExpand(id, !wasExpanded);
            }

            return next;
        });
    };

    const handleNodeClick = (node) => {
        if (node.hasChildren) {
            toggle(node.id);
        }
        if (onNodeClick) {
            onNodeClick(node);
        }
    };

    if (!safeData) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No data provided
            </div>
        );
    }

    return (
        <div
            className={`relative w-full h-full bg-white ${className}`}
            style={{ ...style, overflow: 'auto' }}
        >
            <style>{`
        .mm-node {
          transition: transform ${animationDuration}ms ease;
          transform-box: fill-box;
          transform-origin: 0 0;
        }
        .mm-label {
          transition: transform ${animationDuration}ms ease, opacity ${animationDuration}ms ease;
          transform-origin: left center;
        }
        .mm-link path {
          opacity: 0.9;
          transition: opacity ${animationDuration}ms ease;
        }
      `}</style>

            <svg
                width={layout.bounds.maxX}
                height={layout.bounds.maxY}
                viewBox={`0 0 ${layout.bounds.maxX} ${layout.bounds.maxY}`}
                style={{ display: 'block' }}
            >
                <g className="mm-link">
                    {layout.links.map((lnk) => (
                        <path
                            key={lnk.id}
                            d={diagonal(lnk.source, lnk.target)}
                            fill="none"
                            stroke={colors.link}
                            strokeWidth={2}
                        />
                    ))}
                </g>

                <g>
                    {layout.nodes.map((n) => {
                        const isExpanded = expanded.has(n.id);
                        const isRoot = n.depth === 0;

                        let fill, stroke;
                        if (isRoot) {
                            fill = colors.root.fill;
                            stroke = colors.root.stroke;
                        } else if (n.hasChildren) {
                            fill = colors.branch.fill;
                            stroke = colors.branch.stroke;
                        } else {
                            fill = colors.leaf.fill;
                            stroke = colors.leaf.stroke;
                        }

                        const labelTransform = `translate(${nodeLabelGap}, ${-n.boxH / 2}) scale(${n.hasChildren ? (isExpanded ? 1 : 0.985) : 1
                            })`;

                        return (
                            <g
                                key={n.id}
                                className="mm-node"
                                transform={`translate(${n.x}, ${n.y})`}
                                style={{ cursor: n.hasChildren ? 'pointer' : 'default' }}
                                onClick={() => handleNodeClick(n)}
                            >
                                <circle
                                    r={nodeRadius}
                                    fill="#fff"
                                    stroke={stroke}
                                    strokeWidth="2"
                                />

                                <g className="mm-label" transform={labelTransform}>
                                    <rect
                                        width={n.boxW}
                                        height={n.boxH}
                                        rx="12"
                                        ry="12"
                                        fill={fill}
                                        stroke={stroke}
                                        strokeWidth="1.5"
                                        opacity="0.98"
                                    />
                                    <text
                                        x={14}
                                        y={n.boxH / 2 + 5}
                                        fontSize="14"
                                        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
                                        fill="#1f2a44"
                                    >
                                        {n.label}
                                    </text>

                                    {n.hasChildren && (
                                        <text
                                            x={n.boxW - 18}
                                            y={n.boxH / 2 + 5}
                                            fontSize="16"
                                            fontFamily="ui-sans-serif, system-ui"
                                            fill="#1f2a44"
                                            opacity="0.8"
                                        >
                                            {isExpanded ? '−' : '+'}
                                        </text>
                                    )}
                                </g>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

export default MindMap;