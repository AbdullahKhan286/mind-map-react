import { useState, useMemo } from 'react';
import { hierarchy, tree } from 'd3-hierarchy';

/* -------------------- CONFIG -------------------- */
const FONT_SIZE = 16;
const FONT = `${FONT_SIZE}px ui-sans-serif, system-ui`;
const LINE_HEIGHT = 20;
const MAX_TEXT_WIDTH = 260;
const PADDING_X = 22;
const PADDING_Y = 18;
const CONNECTOR_RADIUS = 9;
const CONNECTOR_OVERLAP = 0;

/* -------------------- TEXT UTILS -------------------- */
function measureText(text, font = FONT) {
    if (typeof document === 'undefined') return 100;
    const canvas = measureText.canvas || (measureText.canvas = document.createElement('canvas'));
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
}

function wrapText(text, maxWidth) {
    const words = String(text).split(' ');
    const lines = [];
    let line = '';

    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (measureText(test) > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
}

/* -------------------- DATA HELPERS -------------------- */
function normalizeTree(input) {
    if (!input || typeof input !== 'object') return null;
    let auto = 0;

    const walk = (node) => {
        if (!node) return null;
        const id = node.id ?? `auto_${auto++}`;
        const label = node.label ?? node.name ?? String(id);
        const children = Array.isArray(node.children)
            ? node.children.map(walk).filter(Boolean)
            : [];
        return { id, label, children };
    };

    return walk(input);
}

function collectExpandableIds(node, set) {
    if (node?.children?.length) set.add(node.id);
    node.children?.forEach((c) => collectExpandableIds(c, set));
    return set;
}

function buildVisibleTree(node, expanded) {
    if (!node) return null;
    if (!expanded.has(node.id)) return { ...node, children: [] };
    return { ...node, children: node.children.map((c) => buildVisibleTree(c, expanded)) };
}

/* -------------------- LINK CURVE -------------------- */
function diagonal(s, t) {
    const dx = t.x - s.x;
    const curve = Math.min(200, Math.abs(dx) * 0.6);

    return `
    M ${s.x} ${s.y}
    C ${s.x + curve} ${s.y},
      ${t.x - curve} ${t.y},
      ${t.x} ${t.y}
  `;
}

/* -------------------- COMPONENT -------------------- */
const MindMap = ({
    data,
    nodeSpacing = { x: 380, y: 140 },
    padding = 80,
    colors = {
        root: { fill: '#c7d2fe', stroke: '#6366f1' },
        branch: { fill: '#bae6fd', stroke: '#0284c7' },
        leaf: { fill: '#bbf7d0', stroke: '#16a34a' },
        link: '#c7d2fe',
    },
}) => {
    const safeData = useMemo(() => normalizeTree(data), [data]);
    const [expanded, setExpanded] = useState(new Set());

    const expandableIds = useMemo(() => {
        if (!safeData) return new Set();
        return collectExpandableIds(safeData, new Set());
    }, [safeData]);

    const visibleData = useMemo(() => {
        if (!safeData) return null;
        return buildVisibleTree(safeData, expanded);
    }, [safeData, expanded]);

    const layout = useMemo(() => {
        if (!visibleData) return { nodes: [], links: [], bounds: { maxX: 1200, maxY: 800 } };

        const root = hierarchy(visibleData);
        tree().nodeSize([nodeSpacing.y, nodeSpacing.x])(root);

        const nodes = root.descendants().map((n) => {
            const lines = wrapText(n.data.label, MAX_TEXT_WIDTH);
            const textWidth = Math.max(...lines.map(measureText));
            const boxW = textWidth + PADDING_X * 2;
            const boxH = lines.length * LINE_HEIGHT + PADDING_Y * 2;

            return {
                id: n.data.id,
                label: n.data.label,
                lines,
                depth: n.depth,
                hasChildren: expandableIds.has(n.data.id),
                x: n.y,
                y: n.x,
                boxW,
                boxH,
            };
        });

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        nodes.forEach((n) => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y - n.boxH / 2);
            maxX = Math.max(maxX, n.x + n.boxW + 40);
            maxY = Math.max(maxY, n.y + n.boxH / 2);
        });

        const shiftX = padding - minX;
        const shiftY = padding - minY;

        nodes.forEach((n) => {
            n.x += shiftX;
            n.y += shiftY;
        });

        const byId = new Map(nodes.map((n) => [n.id, n]));

        const links = root.links().map((l) => {
            const s = byId.get(l.source.data.id);
            const t = byId.get(l.target.data.id);
            return {
                id: `${s.id}-${t.id}`,
                source: { x: s.x, y: s.y },
                target: { x: t.x + CONNECTOR_RADIUS, y: t.y },
            };
        });

        return {
            nodes,
            links,
            bounds: {
                maxX: maxX + shiftX + padding,
                maxY: maxY + shiftY + padding,
            },
        };
    }, [visibleData, expandableIds, nodeSpacing, padding]);

    const toggle = (id) => {
        if (!expandableIds.has(id)) return;
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    if (!safeData) return <div>No data</div>;

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#fff' }}>
            <svg width={layout.bounds.maxX} height={layout.bounds.maxY}>
                {/* Links */}
                {layout.links.map((l) => (
                    <path
                        key={l.id}
                        d={diagonal(l.source, l.target)}
                        fill="none"
                        stroke={colors.link}
                        strokeWidth="2"
                        style={{ transition: 'all 300ms ease' }}
                    />
                ))}

                {/* Nodes */}
                {layout.nodes.map((n) => {
                    const isRoot = n.depth === 0;
                    const fill = isRoot
                        ? colors.root.fill
                        : n.hasChildren
                            ? colors.branch.fill
                            : colors.leaf.fill;

                    const stroke = isRoot
                        ? colors.root.stroke
                        : n.hasChildren
                            ? colors.branch.stroke
                            : colors.leaf.stroke;

                    return (
                        <g
                            key={n.id}
                            transform={`translate(${n.x}, ${n.y})`}
                            style={{ transition: 'transform 300ms ease' }}
                        >
                            {/* Label box (shifted right) */}
                            <g transform={`translate(${CONNECTOR_RADIUS - CONNECTOR_OVERLAP}, ${-n.boxH / 2})`}>
                                <rect
                                    width={n.boxW}
                                    height={n.boxH}
                                    rx="14"
                                    fill={fill}
                                    stroke={stroke}
                                    strokeWidth="2"
                                />

                                {/* Centered text */}
                                <text
                                    fontSize={FONT_SIZE}
                                    fontFamily="system-ui"
                                    fill="#1f2937"
                                    textAnchor="middle"
                                >
                                    {n.lines.map((line, i) => (
                                        <tspan
                                            key={i}
                                            x={n.boxW / 2}
                                            y={
                                                n.boxH / 2 -
                                                ((n.lines.length - 1) * LINE_HEIGHT) / 2 +
                                                i * LINE_HEIGHT +
                                                6
                                            }
                                        >
                                            {line}
                                        </tspan>
                                    ))}
                                </text>
                            </g>

                            {/* Connector dot (overlapping box) */}
                            <g
                                transform={`translate(${CONNECTOR_RADIUS}, 0)`}
                                onClick={() => toggle(n.id)}
                                style={{ cursor: n.hasChildren ? 'pointer' : 'default' }}
                            >
                                <circle
                                    r={CONNECTOR_RADIUS}
                                    fill="#fff"
                                    stroke={stroke}
                                    strokeWidth="2"
                                />

                                {n.hasChildren && (
                                    <text
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="14"
                                        fontWeight="600"
                                        fill={stroke}
                                        pointerEvents="none"
                                    >
                                        {expanded.has(n.id) ? '−' : '+'}
                                    </text>
                                )}
                            </g>

                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default MindMap;
