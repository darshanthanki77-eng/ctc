import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo
} from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Globe, DollarSign, CheckCircle, Lock,
  AlertTriangle, Clock, Search, ZoomIn, ZoomOut,
  Maximize2, Home, RotateCcw, User, Network,
  ChevronDown, ChevronUp, Loader2, Plus, Minus
} from 'lucide-react';
import { fetchProfile } from '../redux/slices/authSlice';
import api from '../api';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const NODE_W  = 250;
const NODE_H  = 196;
const V_GAP   = 80;
const H_GAP   = 28;
const TIP_W   = 290;
const TIP_H   = 360;
const TIP_GAP = 14;

const LEVEL_PERCENTAGES  = [15,8,7,4,4,3,3,3,3,4,5,7,8,8,12,15,8,7,4,4,3,3,3,3,4,5,7,8,8,12];
const LEVEL_REQUIREMENTS = [
  {s:20,d:2},{s:40,d:3},{s:60,d:4},{s:80,d:5},{s:120,d:6},
  {s:200,d:7},{s:300,d:8},{s:400,d:9},{s:400,d:10},{s:500,d:11},
  {s:600,d:12},{s:700,d:13},{s:900,d:14},{s:900,d:15},{s:1000,d:16},
  {s:1100,d:17},{s:1200,d:18},{s:1300,d:19},{s:1400,d:20},{s:1500,d:21},
  {s:1600,d:22},{s:1700,d:23},{s:1800,d:24},{s:1900,d:25},{s:2000,d:26},
  {s:2200,d:27},{s:2400,d:28},{s:2700,d:29},{s:3000,d:30},{s:3000,d:30}
];
const STATUS_CFG = {
  Qualified: { badge:'badge-green', icon:CheckCircle,   color:'#22C55E' },
  Locked:    { badge:'badge-gray',  icon:Lock,          color:'#6B7280' },
  Deficit:   { badge:'badge-red',   icon:AlertTriangle, color:'#EF4444' },
  Pending:   { badge:'badge-amber', icon:Clock,         color:'#F59E0B' },
};

/* ─────────────────────────────────────────────
   TREE HELPERS
───────────────────────────────────────────── */
function updateNodeInTree(root, nodeId, updater) {
  if (!root) return root;
  if (String(root._id) === String(nodeId)) return updater({ ...root });
  if (!root.children || !root.children.length) return root;
  return { ...root, children: root.children.map(c => updateNodeInTree(c, nodeId, updater)) };
}

function calcSubtreeWidth(node) {
  if (!node._expanded || !node.children || !node.children.length) return NODE_W;
  const total = node.children.reduce((acc, c) => acc + calcSubtreeWidth(c) + H_GAP, -H_GAP);
  return Math.max(NODE_W, total);
}

function assignPositions(node, x, y, out) {
  out[String(node._id)] = { x, y };
  if (!node._expanded || !node.children || !node.children.length) return;
  const widths = node.children.map(c => calcSubtreeWidth(c));
  const totalW = widths.reduce((a, w) => a + w, 0) + H_GAP * (node.children.length - 1);
  let curX = x - totalW / 2;
  node.children.forEach((child, i) => {
    assignPositions(child, curX + widths[i] / 2, y + NODE_H + V_GAP, out);
    curX += widths[i] + H_GAP;
  });
}

function calcDims(pos) {
  const xs = Object.values(pos).map(p => p.x);
  const ys = Object.values(pos).map(p => p.y);
  if (!xs.length) return { minX:0, maxX:NODE_W, minY:0, maxY:NODE_H };
  return {
    minX: Math.min(...xs) - NODE_W / 2 - 60,
    maxX: Math.max(...xs) + NODE_W / 2 + 60,
    minY: Math.min(...ys) - 50,
    maxY: Math.max(...ys) + NODE_H + 60,
  };
}

function elbowPath(x1, y1, x2, y2) {
  const midY = (y1 + y2) / 2;
  const r = Math.min(14, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 4);
  if (Math.abs(x2 - x1) < 2) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const dx = x2 > x1 ? 1 : -1;
  return (
    `M ${x1} ${y1} ` +
    `L ${x1} ${midY - r} ` +
    `Q ${x1} ${midY} ${x1 + dx * r} ${midY} ` +
    `L ${x2 - dx * r} ${midY} ` +
    `Q ${x2} ${midY} ${x2} ${midY + r} ` +
    `L ${x2} ${y2}`
  );
}

/* ─────────────────────────────────────────────
   TOOLTIP
───────────────────────────────────────────── */
function computeTooltipPos(rect) {
  if (!rect) return { left:0, top:0, placement:'top', arrowLeft: TIP_W/2 };
  const vw = window.innerWidth, vh = window.innerHeight;
  let left = rect.left + rect.width / 2 - TIP_W / 2;
  let top  = rect.top - TIP_H - TIP_GAP;
  let placement = 'top';
  if (top < 8) { top = rect.bottom + TIP_GAP; placement = 'bottom'; }
  left = Math.max(8, Math.min(left, vw - TIP_W - 8));
  top  = Math.max(8, Math.min(top,  vh - TIP_H - 8));
  const cardCenterX = rect.left + rect.width / 2;
  const arrowLeft   = Math.max(20, Math.min(cardCenterX - left, TIP_W - 20));
  return { left, top, placement, arrowLeft };
}

const NodeTooltip = memo(({ node, rect, visible, onMouseEnter, onMouseLeave, onSelectUser }) => {
  const pos = useMemo(() => computeTooltipPos(rect), [rect]);
  if (!node || !rect) return null;
  const arrowUp   = pos.placement === 'bottom';
  const arrowDown = pos.placement === 'top';
  const joinDate  = node.createdAt
    ? new Date(node.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : '—';

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key={node._id}
          initial={{ opacity:0, y: arrowUp ? -8 : 8, scale:0.97 }}
          animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y: arrowUp ? -8 : 8, scale:0.97 }}
          transition={{ duration:0.18, ease:'easeOut' }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          style={{ position:'fixed', left:pos.left, top:pos.top, width:TIP_W, zIndex:99999, pointerEvents:'none' }}
        >
          <div style={{ background:'rgba(255,255,255,0.98)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderRadius:18, border:'1px solid rgba(243,16,253,0.22)', boxShadow:'0 20px 60px rgba(0,0,0,0.22)', padding:18, position:'relative', pointerEvents:'auto' }}>
            {arrowDown && <div style={{ position:'absolute', bottom:-7, left:pos.arrowLeft-6, width:12, height:12, background:'rgba(255,255,255,0.98)', borderRight:'1px solid rgba(243,16,253,0.22)', borderBottom:'1px solid rgba(243,16,253,0.22)', transform:'rotate(45deg)' }}/>}
            {arrowUp   && <div style={{ position:'absolute', top:-7, left:pos.arrowLeft-6, width:12, height:12, background:'rgba(255,255,255,0.98)', borderLeft:'1px solid rgba(243,16,253,0.22)', borderTop:'1px solid rgba(243,16,253,0.22)', transform:'rotate(45deg)' }}/>}
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, paddingBottom:12, borderBottom:'1px solid rgba(243,16,253,0.08)' }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:46, height:46, borderRadius:'50%', background: node.isRoot ? 'linear-gradient(135deg,#a855f7,#F310FD)' : 'linear-gradient(135deg,#7C3AED,#F310FD)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:15, fontWeight:900, boxShadow:'0 4px 14px rgba(243,16,253,0.3)' }}>
                  {node.isRoot ? '👑' : (node.userId||'').substring(0,2).toUpperCase()}
                </div>
                {node.isActive && <div style={{ position:'absolute', bottom:1, right:1, width:11, height:11, borderRadius:'50%', background:'#22C55E', border:'2px solid #fff', boxShadow:'0 0 7px #22C55E' }}/>}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{node.fullName || '—'}</div>
                <div style={{ fontSize:12, color:'#64748B' }}>{node.userId}</div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:3, background: node.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)', color: node.isActive ? '#22C55E' : '#64748B', borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:700 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', boxShadow: node.isActive ? '0 0 4px currentColor' : 'none' }}/>
                  {node.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginBottom:14 }}>
              {[
                { label:'Stake',     val:`$${(node.totalInvestment||0).toLocaleString()}`, color:'#F310FD' },
                { label:'Directs',   val: node.childrenCount ?? 0,                          color:'#22C55E' },
                { label:'Total Team',val: node.totalTeam ?? 0,                              color:'#7C3AED' },
                { label:'Rank',      val: node.rank || 'None',                              color:'#64748B' },
                { label:'Package',   val: node.packageName || 'None',                       color:'#F310FD' },
                { label:'Joined',    val: joinDate,                                         color:'#64748B' },
              ].map((item,i) => (
                <div key={i} style={{ background:'rgba(243,16,253,0.022)', borderRadius:10, padding:'7px 10px', border:'1px solid rgba(243,16,253,0.06)' }}>
                  <div style={{ fontSize:'9.5px', color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{item.label}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:item.color, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.val}</div>
                </div>
              ))}
            </div>
            {/* Action buttons */}
            <div style={{ display:'flex' }}>
              <button
                onClick={() => onSelectUser && onSelectUser(node)}
                style={{ flex:1, padding:'9px 4px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', background:'linear-gradient(135deg,#7C3AED,#F310FD)', color:'#fff', border:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:'0 4px 14px rgba(243,16,253,0.3)' }}
              >
                <Network size={13}/> View Network
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
});

/* ─────────────────────────────────────────────
   PROFESSIONAL NODE CARD
───────────────────────────────────────────── */
const NodeCard = memo(({ node, x, y, isHighlighted, onExpand, onCollapse }) => {
  const cardRef = useRef(null);

  const hasChildren = (node.childrenCount ?? 0) > 0;
  const isExpanded  = node._expanded && node.children && node.children.length > 0;
  const isLoading   = node._loading;
  const statusColor = node.isActive ? '#22C55E' : '#EF4444';
  const borderLeft  = `4px solid ${node.isActive ? '#22C55E' : '#EF4444'}`;

  const joinDate = node.createdAt
    ? new Date(node.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : '—';

  return (
    <motion.div
      ref={cardRef}
      data-node="1"
      initial={{ opacity:0, scale:0.88, y:-12 }}
      animate={{ opacity:1, scale:1,    y:0 }}
      transition={{ duration:0.22, ease:[0.16,1,0.3,1] }}
      onClick={() => {
        if (hasChildren && !isLoading) {
          isExpanded ? onCollapse(node._id) : onExpand(node);
        }
      }}
      style={{
        position: 'absolute',
        left: x - NODE_W / 2,
        top: y,
        width: NODE_W,
        background: isHighlighted ? 'rgba(243,16,253,0.03)' : '#FFFFFF',
        borderRadius: 18,
        borderLeft,
        border: `1px solid ${isHighlighted ? '#F310FD' : 'rgba(243,16,253,0.15)'}`,
        boxShadow: isHighlighted
          ? '0 8px 32px rgba(243,16,253,0.18)'
          : '0 4px 20px rgba(0,0,0,0.09)',
        transition: 'box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease',
        zIndex: isHighlighted ? 50 : 10,
        userSelect: 'none',
        overflow: 'hidden',
        cursor: hasChildren ? 'pointer' : 'default',
      }}
    >
      {/* ── Header: Avatar + Name + Status */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px 10px', borderBottom:'1px solid rgba(243,16,253,0.07)' }}>
        {/* Avatar */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <div style={{
            width:38, height:38, borderRadius:'50%',
            background: node.isRoot
              ? 'linear-gradient(135deg,#a855f7,#F310FD)'
              : 'linear-gradient(135deg,#7C3AED,#F310FD)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontSize:13, fontWeight:900,
            boxShadow:'0 3px 10px rgba(243,16,253,0.28)',
          }}>
            {node.isRoot ? '👑' : (node.userId||'U').substring(0,2).toUpperCase()}
          </div>
          <div style={{
            position:'absolute', bottom:0, right:0,
            width:10, height:10, borderRadius:'50%',
            background: statusColor, border:'2px solid #fff',
            boxShadow: `0 0 6px ${statusColor}`,
          }}/>
        </div>

        {/* Name + ID */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#0F172A', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {node.userId}
          </div>
          <div style={{ fontSize:11, color:'#64748B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>
            {node.fullName || '—'}
          </div>
        </div>

        {/* Status badge */}
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:4, background: node.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderRadius:20, padding:'3px 8px' }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:statusColor, boxShadow: `0 0 4px ${statusColor}` }}/>
          <span style={{ fontSize:10, fontWeight:700, color:statusColor, whiteSpace:'nowrap' }}>
            {node.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* ── Body: Package + Stake */}
      <div style={{ padding:'9px 14px 8px', display:'flex', flexDirection:'column', gap:5 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:10.5, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Package</span>
          <span style={{ fontSize:11.5, fontWeight:700, color:'#7C3AED', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {node.packageName || 'None'}
          </span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:10.5, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Stake</span>
          <span style={{ fontSize:12, fontWeight:800, color:'#F310FD', fontFamily:'monospace' }}>
            ${(node.totalInvestment||0).toLocaleString()}
          </span>
        </div>

        {/* Directs + Team stat pills */}
        <div style={{ display:'flex', gap:6, marginTop:3 }}>
          <div style={{ flex:1, background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.12)', borderRadius:8, padding:'5px 0', textAlign:'center' }}>
            <div style={{ fontSize:9.5, color:'#64748B', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Directs</div>
            <div style={{ fontSize:15, fontWeight:900, color:'#22C55E', lineHeight:1.1 }}>{node.childrenCount ?? 0}</div>
          </div>
          <div style={{ flex:1, background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.12)', borderRadius:8, padding:'5px 0', textAlign:'center' }}>
            <div style={{ fontSize:9.5, color:'#64748B', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Team</div>
            <div style={{ fontSize:15, fontWeight:900, color:'#7C3AED', lineHeight:1.1 }}>{node.totalTeam ?? 0}</div>
          </div>
        </div>
      </div>

      {/* ── Footer: Join date + Expand button */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 14px 11px', borderTop:'1px solid rgba(243,16,253,0.07)' }}>
        <span style={{ fontSize:10, color:'#94A3B8', fontWeight:500 }}>
          📅 {joinDate}
        </span>

        {hasChildren && (
          <button
            onClick={e => {
              e.stopPropagation();
              if (isLoading) return;
              isExpanded ? onCollapse(node._id) : onExpand(node);
            }}
            title={isExpanded ? 'Collapse children (−)' : `Expand ${node.childrenCount} direct referral(s) (+)`}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: isExpanded
                ? '#FFFFFF'
                : 'linear-gradient(135deg, #7C3AED, #F310FD)',
              border: isExpanded ? '2px solid #F310FD' : 'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor: isLoading ? 'wait' : 'pointer',
              color: isExpanded ? '#F310FD' : '#FFFFFF',
              boxShadow: isExpanded ? '0 2px 8px rgba(243,16,253,0.2)' : '0 4px 14px rgba(243,16,253,0.35)',
              transition:'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isExpanded ? (
              <Minus size={16} strokeWidth={3} />
            ) : (
              <Plus size={16} strokeWidth={3} />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
});

/* ─────────────────────────────────────────────
   TREE CANVAS  (lazy expansion)
───────────────────────────────────────────── */
const TreeCanvas = memo(({ rootNode, searchQuery }) => {
  const [treeData,     setTreeData]     = useState(rootNode);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [zoom,       setZoom]       = useState(1);
  const [pan,        setPan]        = useState({ x:0, y:0 });
  const [isPanning,  setIsPanning]  = useState(false);
  const [panStart,   setPanStart]   = useState({ x:0, y:0 });
  const [tipNode,    setTipNode]    = useState(null);
  const [tipRect,    setTipRect]    = useState(null);
  const [tipVisible, setTipVisible] = useState(false);
  const hideTimer   = useRef(null);
  const containerRef= useRef(null);

  useEffect(() => { setTreeData(rootNode); }, [rootNode]);

  /* Hover handlers */
  const handleHoverIn  = useCallback((node, rect) => {
    clearTimeout(hideTimer.current);
    setTipNode(node); setTipRect(rect); setTipVisible(true);
  }, []);
  const handleHoverOut = useCallback(() => {
    hideTimer.current = setTimeout(() => setTipVisible(false), 350);
  }, []);

  /* Positions */
  const positions = useMemo(() => {
    if (!treeData) return {};
    const p = {};
    assignPositions(treeData, 0, 0, p);
    return p;
  }, [treeData]);

  const dims = useMemo(() => calcDims(positions), [positions]);
  const svgW = Math.max(300, dims.maxX - dims.minX);
  const svgH = Math.max(300, dims.maxY - dims.minY);
  const toLocal = (nx, ny) => ({ x: nx - dims.minX, y: ny - dims.minY });

  /* SVG connectors */
  const connectors = useMemo(() => {
    const paths = [];
    const walk  = n => {
      if (!n._expanded || !n.children) return;
      const pp = positions[String(n._id)];
      if (!pp) return;
      const { x:px, y:py } = toLocal(pp.x, pp.y);
      n.children.forEach(child => {
        const cp = positions[String(child._id)];
        if (!cp) return;
        const { x:cx, y:cy } = toLocal(cp.x, cp.y);
        paths.push({ id:`${n._id}-${child._id}`, d: elbowPath(px, py + NODE_H, cx, cy) });
        walk(child);
      });
    };
    if (treeData) walk(treeData);
    return paths;
  }, [treeData, positions]);

  /* ── ONE-BY-ONE EXPAND: toggle _expanded flag */
  const expandNode = useCallback((node) => {
    setTreeData(prev => updateNodeInTree(prev, node._id, n => ({
      ...n,
      _expanded: true,
      _loading: false,
    })));
  }, []);

  /* ── COLLAPSE (keep children loaded, just hide) */
  const collapseNode = useCallback((nodeId) => {
    setTreeData(prev => updateNodeInTree(prev, nodeId, n => ({ ...n, _expanded:false })));
  }, []);

  /* Fit screen */
  const fitScreen = useCallback(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth  || 900;
    const ch = containerRef.current.clientHeight || 600;
    if (svgW <= 0 || svgH <= 0) return;
    const zX = (cw - 80) / svgW;
    const zY = (ch - 80) / svgH;
    // Keep zoom at 1.0 (100%) when root node is loaded; scale down only if tree overflows screen
    const z  = Math.max(0.6, Math.min(zX, zY, 1.0));
    setZoom(z);
    setPan({ x: Math.max(20, (cw - svgW * z) / 2), y: 40 });
  }, [svgW, svgH]);

  useEffect(() => {
    const t = setTimeout(() => fitScreen(), 150);
    return () => clearTimeout(t);
  }, [treeData, fitScreen]);

  const resetZoom  = useCallback(() => fitScreen(), [fitScreen]);
  const centerRoot = useCallback(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth || 900;
    const rootPos = positions[String(treeData?._id)];
    if (!rootPos) return fitScreen();
    const { x:rx } = toLocal(rootPos.x, rootPos.y);
    setPan({ x: cw / 2 - rx * zoom, y: 40 });
  }, [positions, treeData, zoom, fitScreen, dims]);

  /* Pan / Zoom handlers */
  const onMouseDown  = useCallback(e => { if (e.target.closest('[data-node]') || e.target.closest('button')) return; setIsPanning(true); setPanStart({ x:e.clientX-pan.x, y:e.clientY-pan.y }); }, [pan]);
  const onMouseMove  = useCallback(e => { if (!isPanning) return; setPan({ x:e.clientX-panStart.x, y:e.clientY-panStart.y }); }, [isPanning, panStart]);
  const onMouseUp    = useCallback(()  => setIsPanning(false), []);
  const onTouchStart = useCallback(e => { if (e.target.closest('[data-node]')||e.target.closest('button')) return; if (e.touches.length===1) { setIsPanning(true); setPanStart({ x:e.touches[0].clientX-pan.x, y:e.touches[0].clientY-pan.y }); } }, [pan]);
  const onTouchMove  = useCallback(e => { if (!isPanning||e.touches.length!==1) return; setPan({ x:e.touches[0].clientX-panStart.x, y:e.touches[0].clientY-panStart.y }); }, [isPanning, panStart]);
  const onTouchEnd   = useCallback(()  => setIsPanning(false), []);
  const onWheel      = useCallback(e => { e.preventDefault(); setZoom(z => Math.min(Math.max(z*(e.deltaY>0?0.9:1.1),0.15),3)); }, []);

  /* Search match */
  const searchMatch = n => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    return n.userId?.toLowerCase().includes(q) || n.fullName?.toLowerCase().includes(q);
  };

  /* Flat node list */
  const flatNodes = useMemo(() => {
    const list = [];
    const walk = n => { list.push(n); if (n._expanded && n.children) n.children.forEach(c => walk(c)); };
    if (treeData) walk(treeData);
    return list;
  }, [treeData]);

  const toolbarBtns = [
    { icon:ZoomIn,    tip:'Zoom In',      fn:() => setZoom(z => Math.min(z*1.2, 3)) },
    { icon:ZoomOut,   tip:'Zoom Out',     fn:() => setZoom(z => Math.max(z/1.2, 0.15)) },
    { icon:RotateCcw, tip:'Reset View',   fn:resetZoom },
    { icon:Maximize2, tip:'Fit to Screen',fn:fitScreen },
    { icon:Home,      tip:'Center Root',  fn:centerRoot },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(243,16,253,0.1)', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6 }}>
          {toolbarBtns.map(({ icon:Icon, tip, fn }, i) => (
            <button key={i} onClick={fn} title={tip}
              style={{ width:34, height:34, borderRadius:10, background:'rgba(243,16,253,0.06)', border:'1px solid rgba(243,16,253,0.18)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#F310FD', transition:'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.background='#F310FD'; e.currentTarget.style.color='#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(243,16,253,0.06)'; e.currentTarget.style.color='#F310FD'; }}>
              <Icon size={16}/>
            </button>
          ))}
        </div>
        <div style={{ padding:'4px 12px', borderRadius:20, background:'rgba(243,16,253,0.08)', border:'1px solid rgba(243,16,253,0.18)', fontSize:12, fontWeight:800, color:'#F310FD', marginLeft:4 }}>
          {Math.round(zoom*100)}% Zoom
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:10, alignItems:'center', fontSize:11.5, fontWeight:700, flexWrap:'wrap' }}>
          {/* Active Node Filter Button */}
          <button
            onClick={() => setStatusFilter(prev => prev === 'active' ? 'all' : 'active')}
            style={{
              display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20,
              background: statusFilter === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.06)',
              border: statusFilter === 'active' ? '1.5px solid #22C55E' : '1px solid rgba(34,197,94,0.2)',
              color: '#15803D', cursor:'pointer', transition:'all 0.2s ease', fontWeight:700
            }}
          >
            <div style={{ width:9, height:9, borderRadius:'50%', background:'#22C55E', boxShadow:'0 0 6px #22C55E' }}/>
            Active Nodes {statusFilter === 'active' && '✓'}
          </button>

          {/* Inactive Node Filter Button */}
          <button
            onClick={() => setStatusFilter(prev => prev === 'inactive' ? 'all' : 'inactive')}
            style={{
              display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20,
              background: statusFilter === 'inactive' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.06)',
              border: statusFilter === 'inactive' ? '1.5px solid #EF4444' : '1px solid rgba(239,68,68,0.2)',
              color: '#B91C1C', cursor:'pointer', transition:'all 0.2s ease', fontWeight:700
            }}
          >
            <div style={{ width:9, height:9, borderRadius:'50%', background:'#EF4444', boxShadow:'0 0 6px #EF4444' }}/>
            Inactive Nodes {statusFilter === 'inactive' && '✓'}
          </button>

          <span style={{ display:'flex', alignItems:'center', gap:5, color:'#64748B', marginLeft:4 }}>
            <ChevronDown size={13} style={{ color:'#F310FD' }}/> Click to expand
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{ flex:1, position:'relative', overflow:'hidden', cursor:isPanning?'grabbing':'grab', background:'radial-gradient(ellipse at top center, rgba(243,16,253,0.03) 0%, #F8FAFC 100%)', minHeight:580, touchAction:'none' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        <div style={{ transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin:'0 0', position:'absolute', width:svgW, height:svgH, transition:isPanning?'none':'transform 0.08s ease-out' }}>
          {/* SVG connectors */}
          <svg style={{ position:'absolute', top:0, left:0, width:svgW, height:svgH, pointerEvents:'none', overflow:'visible' }}>
            <defs>
              <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#7C3AED"/>
                <stop offset="100%" stopColor="#F310FD"/>
              </linearGradient>
            </defs>
            {connectors.map(c => (
              <path key={c.id} d={c.d} fill="none" stroke="url(#lineGrad2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.8 }}/>
            ))}
          </svg>

          {/* Node cards */}
          {flatNodes.map(n => {
            const pos = positions[String(n._id)];
            if (!pos) return null;
            const { x, y } = toLocal(pos.x, pos.y);
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? n.isActive : !n.isActive);
            const isHighlighted = searchMatch(n) || (statusFilter !== 'all' && matchesStatus);
            const isDimmed = statusFilter !== 'all' && !matchesStatus;

            return (
              <div key={String(n._id)} style={{ opacity: isDimmed ? 0.35 : 1, transition:'opacity 0.25s ease' }}>
                <NodeCard
                  node={n}
                  x={x}
                  y={y}
                  isHighlighted={isHighlighted}
                  onExpand={expandNode}
                  onCollapse={collapseNode}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function Downline() {
  const dispatch = useDispatch();
  const { user, profile } = useSelector(s => s.auth);
  const currentUser = profile || user;

  const [directTeam,   setDirectTeam]   = useState([]);
  const [allLevels,    setAllLevels]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('matrix');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [rootNode,     setRootNode]     = useState(null);

  useEffect(() => {
    dispatch(fetchProfile());
    api.get('/user/team')
      .then(res => {
        setDirectTeam(res.data.directTeam || []);
        setAllLevels(res.data.allLevels   || []);
      })
      .catch(err => console.error('Team fetch error:', err))
      .finally(() => setLoading(false));
  }, [dispatch]);

  /* Build tree node hierarchy when profile and team data load */
  useEffect(() => {
    if (!currentUser) return;

    const root = {
      _id:             currentUser._id,
      userId:          currentUser.userId || 'You',
      fullName:        currentUser.fullName || '',
      totalInvestment: currentUser.totalInvestment || 0,
      totalTeam:       currentUser.totalTeam || 0,
      isActive:        true,
      isRoot:          true,
      rank:            currentUser.rank || 'None',
      packageName:     currentUser.packageName || 'None',
      createdAt:       currentUser.createdAt,
      sponsorId:       currentUser.sponsorId,
      childrenCount:   0,
      _expanded:       false,
      _loading:        false,
      children:        [],
    };

    const map = { [String(currentUser._id)]: root };

    // Register all members from allLevels into map
    allLevels.forEach(lvl => (lvl.members || []).forEach(m => {
      const idStr = String(m._id);
      if (!map[idStr]) {
        map[idStr] = {
          _id:             m._id,
          userId:          m.userId,
          fullName:        m.fullName,
          totalInvestment: m.totalInvestment || 0,
          totalTeam:       m.totalTeam || 0,
          isActive:        m.isActive,
          sponsor:         m.sponsor,
          packageName:     m.packageName || 'None',
          rank:            m.rank || 'None',
          createdAt:       m.createdAt,
          _expanded:       false,
          _loading:        false,
          children:        [],
        };
      }
    }));

    // Register directTeam members into map
    directTeam.forEach(m => {
      const idStr = String(m._id);
      if (!map[idStr]) {
        map[idStr] = {
          _id:             m._id,
          userId:          m.userId,
          fullName:        m.fullName,
          totalInvestment: m.totalInvestment || 0,
          totalTeam:       m.totalTeam || 0,
          isActive:        m.isActive,
          sponsor:         m.sponsor,
          packageName:     m.packageName || 'None',
          rank:            m.rank || 'None',
          createdAt:       m.createdAt,
          _expanded:       false,
          _loading:        false,
          children:        [],
        };
      }
    });

    // Link parents to direct children
    Object.values(map).forEach(n => {
      if (String(n._id) === String(currentUser._id)) return;
      const parentId = String(n.sponsor);
      const parent   = map[parentId] || root;
      if (!parent.children.some(c => String(c._id) === String(n._id))) {
        parent.children.push(n);
      }
    });

    // Set childrenCount for every node
    Object.values(map).forEach(n => {
      n.childrenCount = n.children.length;
    });

    setRootNode(root);
  }, [currentUser, directTeam, allLevels]);

  /* Matrix table helpers */
  const activeDirects   = directTeam.filter(d => d.isActive).length;
  const totalNetwork    = currentUser?.totalTeam || 0;

  const levelsData = LEVEL_REQUIREMENTS.map((r, i) => {
    const lvl   = i + 1;
    const dbL   = allLevels.find(l => l.level === lvl);
    const vol   = dbL ? dbL.members.reduce((a, m) => a + (m.totalInvestment||0), 0) : 0;
    const stake = currentUser?.totalInvestment || 0;
    const unlocked = (currentUser?.manualLevelQualified && lvl <= currentUser.manualLevelQualified) || (stake >= r.s && activeDirects >= r.d);
    let status = 'Locked';
    if (unlocked)                                    status = 'Qualified';
    else if (activeDirects >= r.d && stake < r.s)   status = 'Deficit';
    else if (activeDirects < r.d  && stake >= r.s)  status = 'Pending';
    else if (lvl <= 5)                               status = 'Pending';
    return {
      lvl, matchRate:`${LEVEL_PERCENTAGES[i]}%`, selfTarget:r.s, directsTarget:r.d, vol, status,
      qualified:status==='Qualified', locked:status==='Locked', deficit:status==='Deficit',
      deficitAmt:Math.max(0, r.s - stake),
    };
  });

  const totalBusiness   = levelsData.reduce((a, l) => a + l.vol, 0);
  const levelsQualified = levelsData.filter(l => l.qualified).length;

  const summaryCards = [
    { label:'Direct Members', value:directTeam.length,                   icon:Users,      color:'#7C3AED' },
    { label:'Total Network',  value:totalNetwork,                         icon:Globe,      color:'#22C55E' },
    { label:'Team Volume',    value:`$${totalBusiness.toLocaleString()}`, icon:DollarSign, color:'#F310FD', grad:true },
  ];

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'var(--near-black)' }}>My Team Network</h2>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:4 }}>30-level copy trade matrix · enterprise genealogy tree</p>
        </div>
        <div style={{ display:'flex', background:'rgba(255,255,255,0.5)', border:'1px solid rgba(243,16,253,0.15)', borderRadius:12, padding:4, backdropFilter:'blur(8px)' }}>
          {['matrix','tree'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600, border:'none', cursor:'pointer', transition:'all 0.25s ease', background:activeTab===tab?'var(--gradient)':'transparent', color:activeTab===tab?'white':'var(--muted)' }}>
              {tab === 'matrix' ? 'Matrix Qualification' : 'Genealogy Tree'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
        {summaryCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} style={{ background:'rgba(255,255,255,0.82)', backdropFilter:'blur(12px)', border:`1px solid ${c.color}25`, borderRadius:16, padding:'18px 20px', boxShadow:`0 4px 20px ${c.color}12`, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${c.color}15`, border:`1px solid ${c.color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={20} style={{ color:c.color }}/>
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>{c.label}</div>
                <div style={{ fontSize:26, fontWeight:800, lineHeight:1.1, marginTop:2, ...(c.grad ? { background:'var(--gradient-text)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' } : { color:'var(--near-black)' }) }}>
                  {c.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      {activeTab === 'matrix' ? (
        <div className="table-card" style={{ marginBottom:40 }}>
          <div className="table-header">
            <div>
              <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:'var(--near-black)' }}>Matrix Qualification Table</h3>
              <p style={{ margin:'3px 0 0', fontSize:11, color:'var(--muted)' }}>Network: {totalNetwork} members · {levelsQualified} levels qualified</p>
            </div>
            <span className="badge badge-pink">Live</span>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"/></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Level</th><th>Match Rate</th><th>Self Stake</th><th>Directs</th><th>Status</th></tr></thead>
                <tbody>
                  {levelsData.map(row => {
                    const cfg  = STATUS_CFG[row.status] || STATUS_CFG.Locked;
                    const Icon = cfg.icon;
                    return (
                      <tr key={row.lvl} style={{ borderLeft:`3px solid ${cfg.color}`, opacity:row.locked?0.6:1 }}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:28, height:28, borderRadius:'50%', background:row.qualified?'rgba(34,197,94,0.12)':row.locked?'rgba(107,114,128,0.1)':'rgba(243,16,253,0.08)', border:`1.5px solid ${cfg.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:cfg.color }}>{row.lvl}</div>
                            <span style={{ fontSize:12, fontWeight:600, color:'var(--body-text)' }}>Level {row.lvl}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-pink">{row.matchRate}</span></td>
                        <td>
                          <div style={{ fontFamily:'monospace', fontWeight:700, fontSize:13, color:'var(--near-black)' }}>${row.selfTarget.toLocaleString()}</div>
                          {row.deficit && <div style={{ fontSize:10, color:'var(--red)', fontWeight:600, marginTop:2, display:'flex', alignItems:'center', gap:3 }}><AlertTriangle size={9}/>Deficit: ${row.deficitAmt.toLocaleString()}</div>}
                        </td>
                        <td><div style={{ display:'flex', alignItems:'center', gap:5 }}><Users size={12} style={{ color:'var(--muted)' }}/><span style={{ fontSize:12 }}>{row.directsTarget}</span></div></td>
                        <td><span className={`badge ${cfg.badge}`} style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Icon size={10}/>{row.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginBottom:40, borderRadius:24, overflow:'hidden', boxShadow:'0 4px 30px rgba(243,16,253,0.07)', border:'1px solid rgba(243,16,253,0.1)' }}>
          {/* Tree header with search */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', background:'rgba(255,255,255,0.97)', borderBottom:'1px solid rgba(243,16,253,0.08)', flexWrap:'wrap' }}>
            <div>
              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:'var(--near-black)' }}>Enterprise Genealogy Tree</h3>
              <span style={{ fontSize:11, color:'var(--muted)', fontWeight:500 }}>
                Click <ChevronDown size={11} style={{ verticalAlign:'middle', color:'#F310FD' }}/> on any card to load its direct referrals · Hover for full details · Scroll to zoom
              </span>
            </div>
            <div style={{ marginLeft:'auto', position:'relative' }}>
              <Search size={15} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}/>
              <input
                type="text"
                placeholder="Search user ID or name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10, padding:'7px 12px 7px 34px', fontSize:13, outline:'none', color:'var(--near-black)', width:230 }}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"/></div>
          ) : rootNode ? (
            <TreeCanvas key={rootNode._id} rootNode={rootNode} searchQuery={searchQuery}/>
          ) : (
            <div style={{ padding:40, textAlign:'center', color:'var(--muted)', fontSize:14 }}>No team data available.</div>
          )}
        </div>
      )}
    </div>
  );
}
