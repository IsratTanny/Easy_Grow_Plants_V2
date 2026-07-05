import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    Box, Upload, Download, Trash2, FlipHorizontal, Plus, Minus,
    ImagePlus, Sparkles, X, Move,
} from 'lucide-react';

// Clean, transparent-background potted plants (only pot + plant) so they drop
// onto a room photo as proper cut-outs instead of rectangular photo tiles.
const DECOR_PLANTS = [
    { id: 'snake',     name: 'Snake Plant',  src: '/ar-plants/snake.svg' },
    { id: 'rubber',    name: 'Rubber Plant', src: '/ar-plants/rubber.svg' },
    { id: 'agave',     name: 'Agave',        src: '/ar-plants/agave.svg' },
    { id: 'aloe',      name: 'Aloe Vera',    src: '/ar-plants/aloe.svg' },
    { id: 'cactus',    name: 'Cactus',       src: '/ar-plants/cactus.svg' },
    { id: 'succulent', name: 'Succulent',    src: '/ar-plants/succulent.svg' },
];

export default function ARDecorator() {
    const stageRef = useRef(null);
    const [roomImage, setRoomImage] = useState(null);
    const [placed, setPlaced] = useState([]); // {uid, src, name, xPct, yPct, widthPct, flip}
    const [selectedUid, setSelectedUid] = useState(null);
    const dragState = useRef(null);
    const uidCounter = useRef(0);

    const handleRoomUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setRoomImage(ev.target.result);
        reader.readAsDataURL(file);
    };

    const addPlant = (plant) => {
        if (!roomImage) { toast('Upload a room photo first'); return; }
        uidCounter.current += 1;
        const uid = uidCounter.current;
        setPlaced((prev) => [...prev, {
            uid,
            src: plant.src,
            name: plant.name,
            xPct: 50, yPct: 62, widthPct: 20, flip: false,
        }]);
        setSelectedUid(uid);
    };

    const updateSelected = (patch) => {
        setPlaced((prev) => prev.map((p) => (p.uid === selectedUid ? { ...p, ...patch } : p)));
    };

    const removeSelected = () => {
        setPlaced((prev) => prev.filter((p) => p.uid !== selectedUid));
        setSelectedUid(null);
    };

    const selected = placed.find((p) => p.uid === selectedUid);

    // ---- Dragging ----
    const onPointerDown = (e, uid) => {
        e.preventDefault();
        setSelectedUid(uid);
        const rect = stageRef.current.getBoundingClientRect();
        dragState.current = { uid, rect };
    };

    const onPointerMove = useCallback((e) => {
        const ds = dragState.current;
        if (!ds) return;
        const x = ((e.clientX - ds.rect.left) / ds.rect.width) * 100;
        const y = ((e.clientY - ds.rect.top) / ds.rect.height) * 100;
        setPlaced((prev) => prev.map((p) => (p.uid === ds.uid
            ? { ...p, xPct: Math.max(0, Math.min(100, x)), yPct: Math.max(0, Math.min(100, y)) }
            : p)));
    }, []);

    const onPointerUp = useCallback(() => { dragState.current = null; }, []);

    useEffect(() => {
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [onPointerMove, onPointerUp]);

    // ---- Export (WYSIWYG canvas compositing) ----
    const loadImage = (src) => new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

    const handleDownload = async () => {
        if (!roomImage) { toast('Upload a room photo first'); return; }
        const stage = stageRef.current;
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        try {
            const room = await loadImage(roomImage);
            // object-cover fit
            const scale = Math.max(w / room.width, h / room.height);
            const dw = room.width * scale, dh = room.height * scale;
            ctx.drawImage(room, (w - dw) / 2, (h - dh) / 2, dw, dh);

            for (const p of placed) {
                const img = await loadImage(p.src).catch(() => null);
                if (!img) continue;
                const pw = (p.widthPct / 100) * w;
                const ph = pw * (img.height / img.width);
                const px = (p.xPct / 100) * w - pw / 2;
                const py = (p.yPct / 100) * h - ph / 2;
                ctx.save();
                if (p.flip) {
                    ctx.translate(px + pw, py);
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, 0, 0, pw, ph);
                } else {
                    ctx.drawImage(img, px, py, pw, ph);
                }
                ctx.restore();
            }
            const link = document.createElement('a');
            link.download = 'my-plant-space.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('Design downloaded!');
        } catch (err) {
            console.error('Export failed:', err);
            toast.error('Could not export the image.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-sm border border-nature-50 text-nature-700 mb-3">
                        <Sparkles size={18} className="text-nature-600" />
                        <span className="font-black uppercase tracking-widest text-xs">Plant Visualizer</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Decorate Your Space</h1>
                    <p className="text-gray-500 font-medium mt-1">Upload a photo of your room and preview how our plants look in it.</p>
                </div>
                <button onClick={handleDownload} disabled={!roomImage}
                    className="inline-flex items-center gap-2 bg-nature-900 text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-nature-700 transition-colors shadow-lg disabled:opacity-40 w-fit">
                    <Download className="w-4 h-4" /> Download Design
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* Stage */}
                <div className="lg:col-span-2">
                    <div
                        ref={stageRef}
                        className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-gray-100 shadow-sm bg-nature-50 select-none"
                        onPointerDown={(e) => { if (e.target === e.currentTarget) setSelectedUid(null); }}
                    >
                        {roomImage ? (
                            <img src={roomImage} alt="Room" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                        ) : (
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-center p-6">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-nature-500 mb-4">
                                    <ImagePlus className="w-8 h-8" />
                                </div>
                                <p className="font-black text-gray-700">Upload a room photo</p>
                                <p className="text-xs text-gray-400 font-medium mt-1">JPG or PNG · click to browse</p>
                                <input type="file" accept="image/*" onChange={handleRoomUpload} className="hidden" />
                            </label>
                        )}

                        {placed.map((p) => (
                            <div
                                key={p.uid}
                                onPointerDown={(e) => onPointerDown(e, p.uid)}
                                style={{
                                    left: `${p.xPct}%`, top: `${p.yPct}%`, width: `${p.widthPct}%`,
                                    transform: `translate(-50%, -50%) scaleX(${p.flip ? -1 : 1})`,
                                }}
                                className={`absolute cursor-move touch-none ${selectedUid === p.uid ? 'ring-2 ring-nature-500 ring-offset-2 rounded-lg' : ''}`}
                            >
                                <img src={p.src} alt={p.name} draggable={false}
                                    className="w-full h-auto pointer-events-none drop-shadow-2xl" />
                            </div>
                        ))}
                    </div>

                    {roomImage && (
                        <div className="flex items-center justify-between mt-3">
                            <label className="inline-flex items-center gap-2 text-sm font-bold text-nature-700 cursor-pointer hover:text-nature-900 transition-colors">
                                <Upload className="w-4 h-4" /> Change room photo
                                <input type="file" accept="image/*" onChange={handleRoomUpload} className="hidden" />
                            </label>
                            {placed.length > 0 && (
                                <button onClick={() => { setPlaced([]); setSelectedUid(null); }}
                                    className="text-sm font-bold text-red-400 hover:text-red-600 transition-colors inline-flex items-center gap-1">
                                    <Trash2 className="w-4 h-4" /> Clear all
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="space-y-5">
                    {/* Selected plant controls */}
                    {selected ? (
                        <div className="card p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-gray-900 truncate flex items-center gap-2">
                                    <Move className="w-4 h-4 text-nature-600" /> {selected.name}
                                </h3>
                                <button onClick={removeSelected} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Size</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <button onClick={() => updateSelected({ widthPct: Math.max(6, selected.widthPct - 3) })}
                                        className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100"><Minus className="w-4 h-4" /></button>
                                    <input type="range" min="6" max="80" value={selected.widthPct}
                                        onChange={(e) => updateSelected({ widthPct: Number(e.target.value) })}
                                        className="flex-1 accent-nature-600" />
                                    <button onClick={() => updateSelected({ widthPct: Math.min(80, selected.widthPct + 3) })}
                                        className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100"><Plus className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <button onClick={() => updateSelected({ flip: !selected.flip })}
                                className="w-full inline-flex items-center justify-center gap-2 bg-nature-50 text-nature-700 py-2.5 rounded-xl font-bold text-sm hover:bg-nature-100 transition-colors">
                                <FlipHorizontal className="w-4 h-4" /> Flip
                            </button>
                            <p className="text-[11px] text-gray-400 font-medium text-center">Drag the plant on the photo to reposition.</p>
                        </div>
                    ) : (
                        <div className="card p-5 text-center text-sm text-gray-400 font-medium">
                            {placed.length === 0 ? 'Pick a plant below to place it.' : 'Tap a placed plant to edit it.'}
                        </div>
                    )}

                    {/* Plant palette — clean transparent cut-outs */}
                    <div className="card p-5">
                        <h3 className="font-black text-gray-900 mb-1">Plant Catalog</h3>
                        <p className="text-xs text-gray-400 font-medium mb-3">Tap a plant to drop it in, then drag to position.</p>
                        <div className="grid grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
                            {DECOR_PLANTS.map((plant) => (
                                <button key={plant.id} onClick={() => addPlant(plant)} title={plant.name}
                                    className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-nature-50/50 hover:border-nature-300 hover:bg-nature-50 transition-all p-1.5">
                                    <img src={plant.src} alt={plant.name} draggable={false}
                                        className="w-full h-full object-contain" />
                                    <span className="absolute bottom-0 inset-x-0 text-[10px] font-bold text-nature-700 bg-white/70 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                        {plant.name}
                                    </span>
                                    <span className="absolute inset-0 bg-nature-900/0 group-hover:bg-nature-900/10 flex items-center justify-center transition-all">
                                        <Plus className="w-6 h-6 text-nature-700 opacity-0 group-hover:opacity-100" />
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
