import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { workSuiteService, RestaurantTable, TableShape, FloorPlanWall, WallShape, FloorPlanChair, BarStool } from '@/services/workSuiteService';
import './WorkSuite.css';

const STATUS_CYCLE: RestaurantTable['status'][] = ['AVAILABLE', 'OCCUPIED', 'RESERVED'];
const STATUS_LABEL: Record<RestaurantTable['status'], string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
};

// Below this segment length (px), a wall mousedown+mouseup is treated as an
// accidental click rather than an intentional sketch, and discarded.
const MIN_WALL_LENGTH = 14;
const CHAIR_SIZE = 28;
const STOOL_SIZE = 28;
const MIN_TABLE_SIZE = 40;
const MAX_TABLE_SIZE = 400;

// A dedicated drag-payload marker so the drop handler can tell "place a
// chair" apart from "place a round/square/rectangle/half-circle table"
// without a second data-transfer key.
const CHAIR_DRAG_PAYLOAD = 'chair';
// A stool is bar seating, not a dining-table chair — placed freely (no
// snapping to a table) since a bar counter isn't a table on this canvas.
// The Bar module reads these directly to show a seating chart.
const STOOL_DRAG_PAYLOAD = 'stool';

// How close a chair's center needs to land to a table's edge (in canvas
// units) before it snaps to that edge instead of staying wherever it was
// dropped/dragged. Small gap between the chair and the table edge so they
// read as "pulled up to" the table rather than overlapping it.
const CHAIR_SNAP_DISTANCE = 55;
const CHAIR_TABLE_GAP = 4;

// Finds the nearest table to (x, y) and, if within snap range, returns the
// point on that table's edge closest to the drop angle — so a chair dropped
// anywhere near a table lands neatly against its rim rather than needing to
// be nudged into place by hand. Treats every table shape as an ellipse
// boundary (width/height radii), which is an exact fit for round tables and
// a close, natural-looking approximation for square/rectangle/half-circle.
const snapChairToTable = (x: number, y: number, tables: RestaurantTable[]): { x: number; y: number } => {
  const chairCenterX = x + CHAIR_SIZE / 2;
  const chairCenterY = y + CHAIR_SIZE / 2;
  let nearest: { table: RestaurantTable; dist: number } | null = null;

  for (const table of tables) {
    const cx = table.positionX + table.width / 2;
    const cy = table.positionY + table.height / 2;
    const rx = table.width / 2 + CHAIR_TABLE_GAP + CHAIR_SIZE / 2;
    const ry = table.height / 2 + CHAIR_TABLE_GAP + CHAIR_SIZE / 2;
    const dist = Math.hypot(chairCenterX - cx, chairCenterY - cy) - Math.hypot(rx, ry) / Math.SQRT2;
    if (!nearest || dist < nearest.dist) nearest = { table, dist };
  }

  if (!nearest || nearest.dist > CHAIR_SNAP_DISTANCE) {
    return { x, y };
  }

  const table = nearest.table;
  const cx = table.positionX + table.width / 2;
  const cy = table.positionY + table.height / 2;
  const rx = table.width / 2 + CHAIR_TABLE_GAP + CHAIR_SIZE / 2;
  const ry = table.height / 2 + CHAIR_TABLE_GAP + CHAIR_SIZE / 2;
  const angle = Math.atan2(chairCenterY - cy, chairCenterX - cx);
  const snappedCenterX = cx + rx * Math.cos(angle);
  const snappedCenterY = cy + ry * Math.sin(angle);
  return { x: Math.round(snappedCenterX - CHAIR_SIZE / 2), y: Math.round(snappedCenterY - CHAIR_SIZE / 2) };
};

const rectsOverlap = (
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
  margin = 0,
) => ax < bx + bw - margin && ax + aw - margin > bx && ay < by + bh - margin && ay + ah - margin > by;

// Tables may never sit on top of one another — checked against every other
// table's current bounding box, excluding the one being moved/resized itself.
const tableOverlapsAny = (id: string, x: number, y: number, width: number, height: number, tables: RestaurantTable[]) =>
  tables.some((t) => t.id !== id && rectsOverlap(x, y, width, height, t.positionX, t.positionY, t.width, t.height));

// Same rule for chairs against each other. A small margin keeps chairs that
// are snapped adjacent around the same table (bounding boxes nearly
// touching at the corners) from being falsely flagged as overlapping.
const CHAIR_OVERLAP_MARGIN = 6;
const chairOverlapsAny = (id: string, x: number, y: number, chairs: FloorPlanChair[]) =>
  chairs.some((c) => c.id !== id && rectsOverlap(x, y, CHAIR_SIZE, CHAIR_SIZE, c.positionX, c.positionY, CHAIR_SIZE, CHAIR_SIZE, CHAIR_OVERLAP_MARGIN));

// Same rule for stools against each other — stools don't snap to tables, so
// there's no "adjacent around the same table" case to allow for, but a
// small margin keeps the check forgiving for stools placed side by side
// along a bar counter.
const STOOL_OVERLAP_MARGIN = 6;
const stoolOverlapsAny = (id: string, x: number, y: number, stools: BarStool[]) =>
  stools.some((s) => s.id !== id && rectsOverlap(x, y, STOOL_SIZE, STOOL_SIZE, s.positionX, s.positionY, STOOL_SIZE, STOOL_SIZE, STOOL_OVERLAP_MARGIN));

// Mirrors the backend's per-shape default size (workSuiteService.ts,
// DEFAULT_TABLE_SIZE) so a newly-dropped table's overlap check uses its
// actual footprint instead of assuming a uniform 90x90 square.
const DEFAULT_TABLE_SIZE: Record<TableShape, { width: number; height: number }> = {
  round: { width: 90, height: 90 },
  square: { width: 90, height: 90 },
  rectangle: { width: 130, height: 76 },
  'half-circle': { width: 130, height: 65 },
};

// The canvas is a fixed logical size, larger than the visible viewport —
// zoom scales it visually (CSS transform) and the viewport scrolls to pan
// around it. All wall/table coordinates live in this logical space, never
// in on-screen pixels, so they stay correct at any zoom level.
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1000;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

const TABLE_SHAPE_OPTIONS: { shape: TableShape; label: string }[] = [
  { shape: 'round', label: 'Round' },
  { shape: 'square', label: 'Square' },
  { shape: 'rectangle', label: 'Rectangle' },
  { shape: 'half-circle', label: 'Half-Circle' },
];

type Mode = 'tables' | 'walls';
type WallTool = WallShape | 'curve';

const wallControlPoint = (wall: FloorPlanWall) => ({
  cx: wall.curveX ?? Math.round((wall.x1 + wall.x2) / 2),
  cy: wall.curveY ?? Math.round((wall.y1 + wall.y2) / 2),
});

const wallPathD = (wall: FloorPlanWall) => {
  const { cx, cy } = wallControlPoint(wall);
  return `M ${wall.x1} ${wall.y1} Q ${cx} ${cy} ${wall.x2} ${wall.y2}`;
};

export const WorkSuiteFloorPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest';

  const [mode, setMode] = useState<Mode>('tables');
  const [wallTool, setWallTool] = useState<WallTool>('line');
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [chairs, setChairs] = useState<FloorPlanChair[]>([]);
  const [stools, setStools] = useState<BarStool[]>([]);
  const [walls, setWalls] = useState<FloorPlanWall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [seats, setSeats] = useState('2');
  const [shape, setShape] = useState<TableShape>('round');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The QR code printed for this table — points guests at the public,
  // no-login ordering page (OrderPage.tsx). Only meaningful once the table
  // actually has an id, so it's generated when editing an existing table,
  // not while creating a new one.
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId || !user?.companyId) {
      setQrCodeDataUrl(null);
      return;
    }
    const orderUrl = `${window.location.origin}/order/${user.companyId}/${editingId}`;
    QRCode.toDataURL(orderUrl, { width: 180, margin: 1 }).then(setQrCodeDataUrl).catch(() => setQrCodeDataUrl(null));
  }, [editingId, user?.companyId]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [zoom, setZoom] = useState(1);
  // A separate, explicit toggle rather than folding delete into the normal
  // draw/move tools — clicking a wall while trying to draw next to it (or a
  // table while trying to move it) shouldn't ever be the thing that erases
  // it. Nothing is deletable by a plain click unless this is on.
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  // kind distinguishes a table drag from a chair drag so one mousemove/up
  // pair can drive both without duplicating the drag machinery.
  const dragState = useRef<{ kind: 'table' | 'chair' | 'stool'; id: string; offsetX: number; offsetY: number; lastX: number; lastY: number; width: number; height: number } | null>(null);
  const wallDraft = useRef<{ shape: WallShape; x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [wallDraftLine, setWallDraftLine] = useState<{ shape: WallShape; x1: number; y1: number; x2: number; y2: number } | null>(null);
  const curveDrag = useRef<{ id: string; lastX: number; lastY: number } | null>(null);
  const resizeState = useRef<{ id: string; startClientX: number; startClientY: number; startWidth: number; startHeight: number; lastWidth: number; lastHeight: number; positionX: number; positionY: number } | null>(null);
  // Kept in sync with `tables` state (see effect below) so the mousemove/drop
  // handlers — which run outside React's render cycle — can always read the
  // latest table positions/sizes for chair snapping without a stale closure.
  const tablesRef = useRef<RestaurantTable[]>([]);
  useEffect(() => {
    tablesRef.current = tables;
  }, [tables]);
  const chairsRef = useRef<FloorPlanChair[]>([]);
  useEffect(() => {
    chairsRef.current = chairs;
  }, [chairs]);
  const stoolsRef = useRef<BarStool[]>([]);
  useEffect(() => {
    stoolsRef.current = stools;
  }, [stools]);

  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100));
  const zoomReset = () => setZoom(1);

  // Mouse-wheel zoom, in place of scrollbars — a plain React onWheel can't
  // reliably preventDefault() (listeners are passive by default), so this
  // attaches a real, non-passive DOM listener instead. Depends on
  // isLoading because the viewport div is conditionally rendered behind
  // it — without that dependency, this effect's first (and only) run
  // would fire while viewportRef.current was still null, and never
  // re-attach once the div actually mounted.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = 1 - Math.max(-0.5, Math.min(0.5, e.deltaY * 0.0015));
      setZoom((z) => Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z * factor)) * 100) / 100);
    };
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [isLoading]);

  const load = async () => {
    setIsLoading(true);
    try {
      const [t, c, s, w] = await Promise.all([workSuiteService.listTables(), workSuiteService.listChairs(), workSuiteService.listStools(), workSuiteService.listWalls()]);
      setTables(t);
      setChairs(c);
      setStools(s);
      setWalls(w);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  const openCreate = () => {
    setEditingId(null);
    setLabel('');
    setSeats('2');
    setShape('round');
    setError(null);
    setShowModal(true);
  };

  const openEdit = (table: RestaurantTable) => {
    setEditingId(table.id);
    setLabel(table.label);
    setSeats(String(table.seats));
    setShape(table.shape);
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    const seatCount = parseInt(seats, 10);
    if (!label.trim() || !seatCount || seatCount < 1) return;
    setIsSaving(true);
    setError(null);
    try {
      if (editingId) {
        await workSuiteService.updateTable(editingId, { label: label.trim(), seats: seatCount, shape });
      } else {
        await workSuiteService.createTable({ label: label.trim(), seats: seatCount, shape });
      }
      setShowModal(false);
      await load();
    } catch {
      setError('Something went wrong saving that table — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (table: RestaurantTable) => {
    setTables((prev) => prev.filter((t) => t.id !== table.id));
    try {
      await workSuiteService.deleteTable(table.id);
    } catch {
      await load();
    }
  };

  const handleTableClick = (table: RestaurantTable) => {
    if (isDeleteMode) {
      handleDelete(table);
      return;
    }
    handleCycleStatus(table);
  };

  const handleCycleStatus = async (table: RestaurantTable) => {
    if (mode !== 'tables') return;
    const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(table.status) + 1) % STATUS_CYCLE.length];
    setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, status: nextStatus } : t)));
    try {
      await workSuiteService.updateTable(table.id, { status: nextStatus });
    } catch {
      await load();
    }
  };

  const handleDeleteWall = async (wall: FloorPlanWall) => {
    setWalls((prev) => prev.filter((w) => w.id !== wall.id));
    try {
      await workSuiteService.deleteWall(wall.id);
    } catch {
      await load();
    }
  };

  const handleDeleteChair = async (chair: FloorPlanChair) => {
    setChairs((prev) => prev.filter((c) => c.id !== chair.id));
    try {
      await workSuiteService.deleteChair(chair.id);
    } catch {
      await load();
    }
  };

  const handleChairClick = (chair: FloorPlanChair) => {
    if (isDeleteMode) handleDeleteChair(chair);
  };

  const handleDeleteStool = async (stool: BarStool) => {
    setStools((prev) => prev.filter((s) => s.id !== stool.id));
    try {
      await workSuiteService.deleteStool(stool.id);
    } catch {
      await load();
    }
  };

  const handleStoolClick = (stool: BarStool) => {
    if (isDeleteMode) handleDeleteStool(stool);
  };

  const handleRenameStool = async (stool: BarStool) => {
    if (isDeleteMode) return;
    const next = window.prompt('Rename this stool', stool.label);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === stool.label) return;
    setStools((prev) => prev.map((s) => (s.id === stool.id ? { ...s, label: trimmed } : s)));
    try {
      await workSuiteService.updateStool(stool.id, { label: trimmed });
    } catch {
      await load();
    }
  };

  // Table/chair drag-to-position — only active in "Move Tables" mode, so
  // it doesn't fight with wall-sketching on the same canvas.
  const handleTableDragStart = (e: React.MouseEvent, table: RestaurantTable) => {
    if (mode !== 'tables' || isDeleteMode) return;
    if ((e.target as HTMLElement).closest('.floorplan-table__action, .floorplan-table__resize-handle')) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const canvasX = (e.clientX - canvasRect.left) / zoom;
    const canvasY = (e.clientY - canvasRect.top) / zoom;
    dragState.current = {
      kind: 'table',
      id: table.id,
      offsetX: canvasX - table.positionX,
      offsetY: canvasY - table.positionY,
      lastX: table.positionX,
      lastY: table.positionY,
      width: table.width,
      height: table.height,
    };
    e.preventDefault();
  };

  const handleChairDragStart = (e: React.MouseEvent, chair: FloorPlanChair) => {
    if (mode !== 'tables' || isDeleteMode) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const canvasX = (e.clientX - canvasRect.left) / zoom;
    const canvasY = (e.clientY - canvasRect.top) / zoom;
    dragState.current = {
      kind: 'chair',
      id: chair.id,
      offsetX: canvasX - chair.positionX,
      offsetY: canvasY - chair.positionY,
      lastX: chair.positionX,
      lastY: chair.positionY,
      width: CHAIR_SIZE,
      height: CHAIR_SIZE,
    };
    e.preventDefault();
  };

  const handleStoolDragStart = (e: React.MouseEvent, stool: BarStool) => {
    if (mode !== 'tables' || isDeleteMode) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const canvasX = (e.clientX - canvasRect.left) / zoom;
    const canvasY = (e.clientY - canvasRect.top) / zoom;
    dragState.current = {
      kind: 'stool',
      id: stool.id,
      offsetX: canvasX - stool.positionX,
      offsetY: canvasY - stool.positionY,
      lastX: stool.positionX,
      lastY: stool.positionY,
      width: STOOL_SIZE,
      height: STOOL_SIZE,
    };
    e.preventDefault();
  };

  // Resize — drag the handle in a table's bottom-right corner to change its
  // width/height directly, rather than through the Edit modal.
  const handleResizeStart = (e: React.MouseEvent, table: RestaurantTable) => {
    if (mode !== 'tables' || isDeleteMode) return;
    resizeState.current = {
      id: table.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startWidth: table.width,
      startHeight: table.height,
      lastWidth: table.width,
      lastHeight: table.height,
      positionX: table.positionX,
      positionY: table.positionY,
    };
    e.stopPropagation();
    e.preventDefault();
  };

  // Palette drag-and-drop — native HTML5 DnD (distinct from the mouse-event
  // dragging used for moving placed tables/walls, which needs to track the
  // pointer outside the element it started on) since this drag only ever
  // needs to know where it landed.
  const handlePaletteDragStart = (e: React.DragEvent, payload: TableShape | typeof CHAIR_DRAG_PAYLOAD | typeof STOOL_DRAG_PAYLOAD) => {
    e.dataTransfer.setData('text/plain', payload);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (mode !== 'tables' || isDeleteMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (mode !== 'tables' || isDeleteMode) return;
    const payload = e.dataTransfer.getData('text/plain');
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const canvasX = (e.clientX - canvasRect.left) / zoom;
    const canvasY = (e.clientY - canvasRect.top) / zoom;

    if (payload === CHAIR_DRAG_PAYLOAD) {
      const rawX = Math.round(Math.max(0, Math.min(CANVAS_WIDTH - CHAIR_SIZE, canvasX - CHAIR_SIZE / 2)));
      const rawY = Math.round(Math.max(0, Math.min(CANVAS_HEIGHT - CHAIR_SIZE, canvasY - CHAIR_SIZE / 2)));
      const { x, y } = snapChairToTable(rawX, rawY, tables);
      if (chairOverlapsAny('', x, y, chairs)) return;
      try {
        const chair = await workSuiteService.createChair({ positionX: x, positionY: y });
        setChairs((prev) => [...prev, chair]);
      } catch {
        await load();
      }
      return;
    }

    if (payload === STOOL_DRAG_PAYLOAD) {
      const x = Math.round(Math.max(0, Math.min(CANVAS_WIDTH - STOOL_SIZE, canvasX - STOOL_SIZE / 2)));
      const y = Math.round(Math.max(0, Math.min(CANVAS_HEIGHT - STOOL_SIZE, canvasY - STOOL_SIZE / 2)));
      if (stoolOverlapsAny('', x, y, stools)) return;
      try {
        const stool = await workSuiteService.createStool({ positionX: x, positionY: y });
        setStools((prev) => [...prev, stool]);
      } catch {
        await load();
      }
      return;
    }

    const droppedShape = payload as TableShape;
    if (!TABLE_SHAPE_OPTIONS.some((o) => o.shape === droppedShape)) return;
    const { width: newWidth, height: newHeight } = DEFAULT_TABLE_SIZE[droppedShape];
    const x = Math.round(Math.max(0, Math.min(CANVAS_WIDTH - newWidth, canvasX - newWidth / 2)));
    const y = Math.round(Math.max(0, Math.min(CANVAS_HEIGHT - newHeight, canvasY - newHeight / 2)));
    if (tableOverlapsAny('', x, y, newWidth, newHeight, tables)) return;
    try {
      const table = await workSuiteService.createTable({
        label: `Table ${tables.length + 1}`,
        shape: droppedShape,
        positionX: x,
        positionY: y,
      });
      setTables((prev) => [...prev, table]);
    } catch {
      await load();
    }
  };

  // Wall sketching — press on empty canvas, drag out a line (or, in circle
  // tool, drag out from a center point like a compass), release to commit
  // it. A separate tool mode from table-moving so the same
  // press-drag-release gesture can't be ambiguous between the two. The
  // curve tool doesn't draw anything new — it only bends existing lines
  // via their handle — so it's excluded here.
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'walls' || wallTool === 'curve' || isDeleteMode) return;
    if ((e.target as HTMLElement).closest('.floorplan-table, .floorplan-wall__hit')) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const x = Math.round((e.clientX - canvasRect.left) / zoom);
    const y = Math.round((e.clientY - canvasRect.top) / zoom);
    wallDraft.current = { shape: wallTool, x1: x, y1: y, x2: x, y2: y };
    setWallDraftLine(wallDraft.current);
  };

  // Curve handle — placed at each line wall's control point (the segment's
  // midpoint until someone bends it); dragging it pulls the wall into a
  // quadratic-bezier curve.
  const handleCurveDragStart = (e: React.MouseEvent, wall: FloorPlanWall) => {
    if (mode !== 'walls' || wallTool !== 'curve' || isDeleteMode) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const { cx, cy } = wallControlPoint(wall);
    curveDrag.current = { id: wall.id, lastX: cx, lastY: cy };
    e.stopPropagation();
    e.preventDefault();
  };

  // handleMouseUp reads the live values off the refs (drag.lastX/lastY,
  // wallDraft.current) rather than back out of React state — a mouseup
  // that fires before the preceding mousemove's render commits would
  // otherwise persist the pre-drag/pre-draw position instead of where the
  // pointer actually ended up.
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const drag = dragState.current;
      if (drag) {
        const canvasX = (e.clientX - canvasRect.left) / zoom;
        const canvasY = (e.clientY - canvasRect.top) / zoom;
        const rawX = Math.round(Math.max(0, Math.min(CANVAS_WIDTH - drag.width, canvasX - drag.offsetX)));
        const rawY = Math.round(Math.max(0, Math.min(CANVAS_HEIGHT - drag.height, canvasY - drag.offsetY)));
        if (drag.kind === 'chair') {
          const { x, y } = snapChairToTable(rawX, rawY, tablesRef.current);
          // Tables/chairs may never sit on top of one another — if this
          // spot collides with another chair, hold at the last valid spot
          // instead of letting the drag push through it.
          if (chairOverlapsAny(drag.id, x, y, chairsRef.current)) return;
          drag.lastX = x;
          drag.lastY = y;
          setChairs((prev) => prev.map((c) => (c.id === drag.id ? { ...c, positionX: x, positionY: y } : c)));
        } else if (drag.kind === 'stool') {
          // No table snapping — a stool sits freely along a bar counter.
          if (stoolOverlapsAny(drag.id, rawX, rawY, stoolsRef.current)) return;
          drag.lastX = rawX;
          drag.lastY = rawY;
          setStools((prev) => prev.map((s) => (s.id === drag.id ? { ...s, positionX: rawX, positionY: rawY } : s)));
        } else {
          if (tableOverlapsAny(drag.id, rawX, rawY, drag.width, drag.height, tablesRef.current)) return;
          drag.lastX = rawX;
          drag.lastY = rawY;
          setTables((prev) => prev.map((t) => (t.id === drag.id ? { ...t, positionX: rawX, positionY: rawY } : t)));
        }
        return;
      }

      const resize = resizeState.current;
      if (resize) {
        const deltaX = (e.clientX - resize.startClientX) / zoom;
        const deltaY = (e.clientY - resize.startClientY) / zoom;
        const width = Math.round(Math.max(MIN_TABLE_SIZE, Math.min(MAX_TABLE_SIZE, resize.startWidth + deltaX)));
        const height = Math.round(Math.max(MIN_TABLE_SIZE, Math.min(MAX_TABLE_SIZE, resize.startHeight + deltaY)));
        // Don't let a resize grow the table into an overlap with another
        // table — freeze at the last non-colliding size instead.
        if (tableOverlapsAny(resize.id, resize.positionX, resize.positionY, width, height, tablesRef.current)) return;
        resize.lastWidth = width;
        resize.lastHeight = height;
        setTables((prev) => prev.map((t) => (t.id === resize.id ? { ...t, width, height } : t)));
        return;
      }

      if (wallDraft.current) {
        const x = Math.round(Math.max(0, Math.min(CANVAS_WIDTH, (e.clientX - canvasRect.left) / zoom)));
        const y = Math.round(Math.max(0, Math.min(CANVAS_HEIGHT, (e.clientY - canvasRect.top) / zoom)));
        wallDraft.current = { ...wallDraft.current, x2: x, y2: y };
        setWallDraftLine(wallDraft.current);
        return;
      }

      const curve = curveDrag.current;
      if (curve) {
        const x = Math.round(Math.max(0, Math.min(CANVAS_WIDTH, (e.clientX - canvasRect.left) / zoom)));
        const y = Math.round(Math.max(0, Math.min(CANVAS_HEIGHT, (e.clientY - canvasRect.top) / zoom)));
        curve.lastX = x;
        curve.lastY = y;
        setWalls((prev) => prev.map((w) => (w.id === curve.id ? { ...w, curveX: x, curveY: y } : w)));
      }
    };

    const handleMouseUp = async () => {
      const drag = dragState.current;
      dragState.current = null;
      if (drag) {
        try {
          if (drag.kind === 'chair') {
            await workSuiteService.updateChair(drag.id, { positionX: drag.lastX, positionY: drag.lastY });
          } else if (drag.kind === 'stool') {
            await workSuiteService.updateStool(drag.id, { positionX: drag.lastX, positionY: drag.lastY });
          } else {
            await workSuiteService.updateTable(drag.id, { positionX: drag.lastX, positionY: drag.lastY });
          }
        } catch {
          await load();
        }
        return;
      }

      const resize = resizeState.current;
      resizeState.current = null;
      if (resize) {
        try {
          await workSuiteService.updateTable(resize.id, { width: resize.lastWidth, height: resize.lastHeight });
        } catch {
          await load();
        }
        return;
      }

      const curve = curveDrag.current;
      curveDrag.current = null;
      if (curve) {
        try {
          await workSuiteService.setWallCurve(curve.id, curve.lastX, curve.lastY);
        } catch {
          await load();
        }
        return;
      }

      const draft = wallDraft.current;
      wallDraft.current = null;
      setWallDraftLine(null);
      if (!draft) return;
      const length = Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1);
      if (length < MIN_WALL_LENGTH) return;
      try {
        const wall = draft.shape === 'circle'
          ? await workSuiteService.createWall({ shape: 'circle', x1: draft.x1, y1: draft.y1, x2: draft.x1, y2: draft.y1, radius: Math.round(length) })
          : await workSuiteService.createWall(draft);
        setWalls((prev) => [...prev, wall]);
      } catch {
        await load();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // zoom must stay a dependency — handleMouseMove converts screen deltas
    // to canvas-space by dividing by it, so a stale closure would misplace
    // drags after the zoom level changes mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const isEmpty = tables.length === 0 && chairs.length === 0 && stools.length === 0 && walls.length === 0;

  return (
    <div className="worksuite-page">
      <ProtectedPageOverlay isVisible={isGuest} />
      <Navbar />

      <div className="worksuite-page__banner">
        <div className="worksuite-page__banner-inner">
          <button className="worksuite-breadcrumb" onClick={() => navigate('/work-suite')}>← Work Suite</button>
          <h1 className="worksuite-page__title">Floor Plan</h1>
          <p className="worksuite-page__subtitle">Sketch your walls, then place tables inside — just like drawing it on paper.</p>
        </div>
      </div>

      <div className="worksuite-page__container">
        <div className="worksuite-page__header-row">
          <div className="floorplan-toolbar">
            <div className="floorplan-mode-toggle">
              <button className={`floorplan-mode-btn ${mode === 'walls' ? 'active' : ''}`} onClick={() => setMode('walls')}>✎ Draw Walls</button>
              <button className={`floorplan-mode-btn ${mode === 'tables' ? 'active' : ''}`} onClick={() => setMode('tables')}>⬚ Move Tables</button>
            </div>
            {mode === 'walls' && (
              <div className="floorplan-mode-toggle">
                <button className={`floorplan-mode-btn ${wallTool === 'line' ? 'active' : ''}`} onClick={() => setWallTool('line')}>／ Straight Wall</button>
                <button className={`floorplan-mode-btn ${wallTool === 'circle' ? 'active' : ''}`} onClick={() => setWallTool('circle')}>◯ Circular Section</button>
                <button className={`floorplan-mode-btn ${wallTool === 'curve' ? 'active' : ''}`} onClick={() => setWallTool('curve')}>∿ Curve</button>
              </div>
            )}
            {mode === 'tables' && (
              <div className="floorplan-palette">
                {TABLE_SHAPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.shape}
                    className="floorplan-palette__item"
                    draggable
                    onDragStart={(e) => handlePaletteDragStart(e, opt.shape)}
                    title={`Drag onto the canvas to place a ${opt.label.toLowerCase()} table`}
                  >
                    <span className={`floorplan-palette__swatch floorplan-palette__swatch--${opt.shape}`} />
                    <span className="floorplan-palette__label">{opt.label}</span>
                  </button>
                ))}
                <button
                  className="floorplan-palette__item"
                  draggable
                  onDragStart={(e) => handlePaletteDragStart(e, CHAIR_DRAG_PAYLOAD)}
                  title="Drag onto the canvas to place a chair"
                >
                  <span className="floorplan-palette__swatch floorplan-palette__swatch--chair" />
                  <span className="floorplan-palette__label">Chair</span>
                </button>
                <button
                  className="floorplan-palette__item"
                  draggable
                  onDragStart={(e) => handlePaletteDragStart(e, STOOL_DRAG_PAYLOAD)}
                  title="Drag onto the canvas to place a bar stool — shows up in the Bar module's seating chart"
                >
                  <span className="floorplan-palette__swatch floorplan-palette__swatch--stool" />
                  <span className="floorplan-palette__label">Stool</span>
                </button>
              </div>
            )}
            <button className="worksuite-create-btn" onClick={openCreate}>+ Add Table</button>
            <button
              className={`floorplan-delete-toggle ${isDeleteMode ? 'active' : ''}`}
              onClick={() => setIsDeleteMode((d) => !d)}
              title={isDeleteMode ? 'Delete mode is on — click any table or wall to remove it' : 'Turn on Delete mode'}
            >
              🗑 {isDeleteMode ? 'Deleting…' : 'Delete'}
            </button>
            <div className="floorplan-zoom">
              <button className="floorplan-zoom__btn" onClick={zoomOut} disabled={zoom <= ZOOM_MIN} title="Zoom out">−</button>
              <button className="floorplan-zoom__level" onClick={zoomReset} title="Reset zoom">{Math.round(zoom * 100)}%</button>
              <button className="floorplan-zoom__btn" onClick={zoomIn} disabled={zoom >= ZOOM_MAX} title="Zoom in">+</button>
            </div>
          </div>
        </div>

        <p className="floorplan-hint">
          {isDeleteMode
            ? 'Delete mode is on — click any table or wall to remove it. Click "Deleting…" again to turn it off.'
            : mode === 'walls'
              ? wallTool === 'circle'
                ? 'Click a center point and drag out the radius to sketch a round booth, alcove, or curved bar.'
                : wallTool === 'curve'
                  ? 'Drag the dot on any straight wall to pull it into a curve.'
                  : 'Click and drag on the canvas to sketch a straight wall.'
              : 'Drag a shape from the palette onto the canvas to add a table, or drag existing tables to arrange them. Click a table to cycle Available → Occupied → Reserved.'}
          {' '}Scroll your mouse wheel over the canvas to zoom in and out, or use the +/− controls above.
        </p>

        {isLoading ? (
          <div className="worksuite-empty">Loading floor plan…</div>
        ) : (
          <div className="floorplan-viewport" ref={viewportRef}>
            {isEmpty && (
              <div className="floorplan-canvas__hint">
                {mode === 'walls' ? 'Click and drag to sketch your first wall.' : 'Drag a table, chair, or stool from the palette above, or switch to Draw Walls to sketch the room first.'}
              </div>
            )}
            <div
              className={`floorplan-canvas floorplan-canvas--${mode} ${isDragOver ? 'floorplan-canvas--drop-target' : ''} ${isDeleteMode ? 'floorplan-canvas--delete-mode' : ''}`}
              ref={canvasRef}
              style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, transform: `scale(${zoom})` }}
              onMouseDown={handleCanvasMouseDown}
              onDragOver={handleCanvasDragOver}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleCanvasDrop}
            >
              <svg className="floorplan-svg">
              {walls.map((wall) => (
                <g key={wall.id}>
                  {wall.shape === 'circle' ? (
                    <>
                      <circle className="floorplan-wall" cx={wall.x1} cy={wall.y1} r={wall.radius || 0} fill="none" />
                      <circle
                        className={`floorplan-wall__hit ${isDeleteMode ? 'floorplan-wall__hit--deletable' : ''}`}
                        cx={wall.x1} cy={wall.y1} r={wall.radius || 0} fill="none"
                        style={{ pointerEvents: isDeleteMode ? 'stroke' : 'none' }}
                        onMouseDown={(e) => { e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); if (isDeleteMode) handleDeleteWall(wall); }}
                      >
                        <title>Click to erase this circular section</title>
                      </circle>
                    </>
                  ) : (
                    <>
                      <path className="floorplan-wall" d={wallPathD(wall)} fill="none" />
                      <path
                        className={`floorplan-wall__hit ${isDeleteMode ? 'floorplan-wall__hit--deletable' : ''}`}
                        d={wallPathD(wall)} fill="none"
                        style={{ pointerEvents: isDeleteMode ? 'stroke' : 'none' }}
                        onMouseDown={(e) => { e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); if (isDeleteMode) handleDeleteWall(wall); }}
                      >
                        <title>Click to erase this wall</title>
                      </path>
                      {wallTool === 'curve' && mode === 'walls' && !isDeleteMode && (() => {
                        const { cx, cy } = wallControlPoint(wall);
                        return (
                          <circle
                            className="floorplan-curve-handle"
                            cx={cx} cy={cy} r={7}
                            onMouseDown={(e) => handleCurveDragStart(e, wall)}
                          >
                            <title>Drag to bend this wall</title>
                          </circle>
                        );
                      })()}
                    </>
                  )}
                </g>
              ))}
              {wallDraftLine && (
                wallDraftLine.shape === 'circle' ? (
                  <circle
                    className="floorplan-wall floorplan-wall--draft"
                    cx={wallDraftLine.x1} cy={wallDraftLine.y1}
                    r={Math.hypot(wallDraftLine.x2 - wallDraftLine.x1, wallDraftLine.y2 - wallDraftLine.y1)}
                    fill="none"
                  />
                ) : (
                  <line className="floorplan-wall floorplan-wall--draft" x1={wallDraftLine.x1} y1={wallDraftLine.y1} x2={wallDraftLine.x2} y2={wallDraftLine.y2} />
                )
              )}
            </svg>

            {chairs.map((chair) => (
              <div
                key={chair.id}
                className={`floorplan-chair ${mode === 'walls' ? 'floorplan-chair--locked' : ''} ${isDeleteMode ? 'floorplan-chair--deletable' : ''}`}
                style={{ left: chair.positionX, top: chair.positionY, width: CHAIR_SIZE, height: CHAIR_SIZE }}
                onMouseDown={(e) => handleChairDragStart(e, chair)}
                onClick={() => handleChairClick(chair)}
                title={isDeleteMode ? 'Click to delete this chair' : 'Drag to move'}
              />
            ))}

            {stools.map((stool) => (
              <div
                key={stool.id}
                className={`floorplan-stool ${mode === 'walls' ? 'floorplan-stool--locked' : ''} ${isDeleteMode ? 'floorplan-stool--deletable' : ''}`}
                style={{ left: stool.positionX, top: stool.positionY, width: STOOL_SIZE, height: STOOL_SIZE }}
                onMouseDown={(e) => handleStoolDragStart(e, stool)}
                onClick={() => handleStoolClick(stool)}
                onDoubleClick={(e) => { e.stopPropagation(); handleRenameStool(stool); }}
                title={isDeleteMode ? 'Click to delete this stool' : `${stool.label} — drag to move, double-click to rename`}
              >
                <span className="floorplan-stool__label">{stool.label}</span>
              </div>
            ))}

            {tables.map((table) => (
              <div
                key={table.id}
                className={`floorplan-table floorplan-table--${table.shape} floorplan-table--${table.status.toLowerCase()} ${mode === 'walls' ? 'floorplan-table--locked' : ''} ${isDeleteMode ? 'floorplan-table--deletable' : ''}`}
                style={{ left: table.positionX, top: table.positionY, width: table.width, height: table.height }}
                onMouseDown={(e) => handleTableDragStart(e, table)}
                onClick={() => handleTableClick(table)}
                title={isDeleteMode ? `Click to delete ${table.label}` : `${table.label} — ${STATUS_LABEL[table.status]}${mode === 'tables' ? ' (click to change, drag to move)' : ''}`}
              >
                <div className="floorplan-table__label">{table.label}</div>
                <div className="floorplan-table__seats">{table.seats} seats</div>
                {mode === 'tables' && !isDeleteMode && (
                  <>
                    <button className="floorplan-table__action floorplan-table__action--edit" onClick={(e) => { e.stopPropagation(); openEdit(table); }}>✎</button>
                    <button className="floorplan-table__action floorplan-table__action--delete" onClick={(e) => { e.stopPropagation(); handleDelete(table); }}>×</button>
                    <div
                      className="floorplan-table__resize-handle"
                      onMouseDown={(e) => handleResizeStart(e, table)}
                      onClick={(e) => e.stopPropagation()}
                      title="Drag to resize"
                    />
                  </>
                )}
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="worksuite-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="worksuite-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Table' : 'Add Table'}</h2>
            <label>Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Table 4, Booth A…" maxLength={40} />
            <label>Seats</label>
            <input type="number" min={1} max={30} value={seats} onChange={(e) => setSeats(e.target.value)} />
            <label>Shape</label>
            <select value={shape} onChange={(e) => setShape(e.target.value as TableShape)}>
              <option value="round">Round</option>
              <option value="square">Square</option>
              <option value="rectangle">Rectangle</option>
              <option value="half-circle">Half-Circle</option>
            </select>
            {error && <p className="worksuite-modal__error">{error}</p>}

            {editingId && (
              <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--tech-border-dim)' }}>
                <label>Table Order QR Code</label>
                {qrCodeDataUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img src={qrCodeDataUrl} alt="Table order QR code" style={{ width: '110px', height: '110px', borderRadius: '6px', background: '#fff', padding: '6px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--tech-text-dim)' }}>
                        Print this and leave it on the table — guests scan it to order without logging in.
                      </p>
                      <button
                        className="worksuite-btn"
                        onClick={() => {
                          const url = `${window.location.origin}/order/${user?.companyId}/${editingId}`;
                          navigator.clipboard.writeText(url).catch(() => {});
                        }}
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--tech-text-dim)' }}>Generating…</p>
                )}
              </div>
            )}

            <div className="worksuite-modal__actions">
              <button className="worksuite-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="worksuite-modal__submit" onClick={handleSave} disabled={!label.trim() || !seats || isSaving}>
                {isSaving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Table'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
