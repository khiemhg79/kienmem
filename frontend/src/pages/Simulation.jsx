import { useState, useEffect, useRef } from 'react'
import { updateDevice } from '../services/api'
import { getFloorPlanConfig, updateFloorPlanConfig } from '../services/api'
import { useDeviceStore } from '../store/deviceStore.jsx'
import { useCameraAI } from '../components/CameraAIProvider'
import {
  Loader2, Lightbulb, Snowflake, Camera, DoorClosed,
  Radio, Server, Wifi, WifiOff, Zap, ZapOff,
  ThermometerSun, Activity, Projector, Printer, Tv, Router
} from 'lucide-react'

const DEVICE_CONFIG = {
  light:  { icon: Lightbulb,   label: 'Đèn',        color: '#FBBF24', glow: 'rgba(251,191,36,0.6)',   clickable: true  },
  ac:     { icon: Snowflake,   label: 'Điều hòa',   color: '#67E8F9', glow: 'rgba(103,232,249,0.6)',  clickable: true  },
  camera: { icon: Camera,      label: 'Camera',      color: '#A78BFA', glow: 'rgba(167,139,250,0.4)',  clickable: true },
  door:   { icon: DoorClosed,  label: 'Cửa',         color: '#34D399', glow: 'rgba(52,211,153,0.6)',   clickable: true  },
  sensor: { icon: Radio,       label: 'Cảm biến',    color: '#FB923C', glow: 'rgba(251,146,60,0.4)',   clickable: true },
  projector:{ icon: Projector, label: 'Máy chiếu',   color: '#F43F5E', glow: 'rgba(244,63,94,0.6)',    clickable: true },
  printer:  { icon: Printer,   label: 'Máy in',      color: '#8B5CF6', glow: 'rgba(139,92,246,0.6)',   clickable: true },
  tv:       { icon: Tv,        label: 'TV',          color: '#3B82F6', glow: 'rgba(59,130,246,0.6)',   clickable: true },
  router:   { icon: Router,    label: 'Router',      color: '#10B981', glow: 'rgba(16,185,129,0.6)',   clickable: true },
}

// Vị trí cố định cho từng tầng
const FLOOR_POSITIONS = {
  1: [
    { x: 20, y: 25 }, { x: 50, y: 20 }, { x: 78, y: 28 },
    { x: 18, y: 65 }, { x: 50, y: 70 }, { x: 80, y: 62 },
  ],
  2: [
    { x: 22, y: 22 }, { x: 55, y: 18 }, { x: 75, y: 30 },
    { x: 20, y: 68 }, { x: 48, y: 72 }, { x: 78, y: 65 },
    { x: 50, y: 45 },
  ],
  3: [
    { x: 18, y: 20 }, { x: 48, y: 16 }, { x: 76, y: 24 },
    { x: 16, y: 60 }, { x: 46, y: 66 }, { x: 77, y: 58 },
    { x: 32, y: 42 },
  ],
}

function DeviceNode({ device, index, floor, onToggle, isEditingLayout, onPositionChange, rotationZ }) {
  const cfg     = DEVICE_CONFIG[device.type] || DEVICE_CONFIG.sensor
  const Icon    = cfg.icon
  const isOn    = device.status
  const defaultPos = (FLOOR_POSITIONS[floor] || FLOOR_POSITIONS[3])[index % 7] || { x: 20 + index * 12, y: 20 + index * 10 }

  const [pos, setPos] = useState({ 
    x: device.settings?.x || defaultPos.x, 
    y: device.settings?.y || defaultPos.y 
  });
  
  useEffect(() => {
    setPos({ 
      x: device.settings?.x || defaultPos.x, 
      y: device.settings?.y || defaultPos.y 
    });
  }, [device.settings?.x, device.settings?.y, defaultPos.x, defaultPos.y]);

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handlePointerDown = (e) => {
    if (!isEditingLayout) return;
    e.preventDefault();
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !isEditingLayout) return;
    // Tỉ lệ vùng container là 680x680 px (nếu scale thay đổi, tỉ lệ phần trăm vẫn tương đối đúng)
    const deltaX = ((e.clientX - dragRef.current.startX) / 680) * 100;
    const deltaY = ((e.clientY - dragRef.current.startY) / 680) * 100;
    
    // Giới hạn trong khoảng 0-100%
    const newX = Math.max(0, Math.min(100, dragRef.current.initialX + deltaX));
    const newY = Math.max(0, Math.min(100, dragRef.current.initialY + deltaY));
    
    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (!isDragging || !isEditingLayout) return;
    e.target.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    onPositionChange(device.id, pos.x, pos.y);
  };

  return (
    <div
      id={`device-node-${device.id}`}
      className={`absolute w-14 h-14 group transition-all duration-300 ${isEditingLayout ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : (cfg.clickable ? 'cursor-pointer' : 'cursor-default')}`}
      style={{
        left: `${pos.x}%`, top: `${pos.y}%`,
        transformStyle: 'preserve-3d',
        transform: 'translate(-50%, -50%) translateZ(2px)',
        zIndex: isDragging ? 100 : (isOn ? 10 : 5),
        transitionDuration: isDragging ? '0ms' : '300ms',
      }}
      onClick={(e) => {
        if (!isEditingLayout && cfg.clickable) {
          onToggle(device);
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Hào quang sàn (Shadow / Glow on floor) */}
      <div
        className="absolute rounded-full transition-all duration-700"
        style={{
          width: 56, height: 56,
          left: '50%', top: '50%',
          background: isOn ? cfg.glow : 'rgba(0,0,0,0.4)',
          filter: 'blur(12px)',
          transform: isEditingLayout
            ? 'translate(-50%, -50%) translateZ(0px) scale(1)'
            : `translate(-50%, -50%) translateZ(1px) scale(${isOn ? 1.4 : 0.8})`,
        }}
      />

      {/* Cột tín hiệu (Thanh dọc kết nối từ sàn lên thiết bị) */}
      {!isEditingLayout && (
        <div
          className="absolute left-1/2 top-1/2 transition-all duration-500"
          style={{
            width: 2,
            height: isOn ? 90 : 30,
            background: isOn
              ? `linear-gradient(to top, transparent, ${cfg.color})`
              : 'linear-gradient(to top, transparent, rgba(100,116,139,0.3))',
            transform: 'translate(-50%, -100%) rotateX(-90deg)',
            transformOrigin: 'bottom center',
            boxShadow: isOn ? `0 0 8px ${cfg.color}` : 'none',
          }}
        />
      )}

      {/* Khối thiết bị (Device Block) */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center absolute transition-all duration-500"
        style={{
          left: '50%', top: '50%',
          background: isOn
            ? `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color}66)`
            : 'linear-gradient(135deg, #334155, #1e293b)',
          boxShadow: isOn
            ? `0 8px 32px ${cfg.glow}, 0 0 0 1px ${cfg.color}44, inset 0 1px 0 rgba(255,255,255,0.2)`
            : '0 8px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          transform: `translate(-50%, -50%) translateZ(${isEditingLayout ? '0px' : (isOn ? '90px' : '30px')})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Icon */}
        <div
          className="transition-transform duration-300 group-hover:scale-110"
          style={{
            transform: isEditingLayout ? 'rotateX(0deg) rotateZ(0deg)' : `rotateZ(${-rotationZ}deg) rotateX(-60deg)`
          }}
        >
          <Icon
            className="w-7 h-7 transition-all duration-300"
            style={{
              color: isOn ? '#fff' : '#64748b',
              filter: isOn ? `drop-shadow(0 0 8px ${cfg.color})` : 'none',
            }}
          />
        </div>

        {/* Đèn trạng thái */}
        <div
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full transition-all duration-300"
          style={{
            background: isOn ? '#4ade80' : '#475569',
            boxShadow: isOn ? '0 0 6px #4ade80' : 'none',
          }}
        />
      </div>

      {/* Nhãn tên */}
      <div
        className="absolute left-1/2 top-1/2 whitespace-nowrap text-xs font-medium px-2.5 py-1 rounded-lg backdrop-blur-md border transition-all duration-500"
        style={{
          background: isOn ? 'rgba(15,23,42,0.8)' : 'rgba(15,23,42,0.6)',
          borderColor: isOn ? `${cfg.color}66` : 'rgba(71,85,105,0.4)',
          color: isOn ? '#f1f5f9' : '#94a3b8',
           transform: isEditingLayout
            ? 'translate(-50%, 44px) translateZ(0px)'
            : `translateZ(${isOn ? '100px' : '42px'}) rotateZ(${-rotationZ}deg) rotateX(-60deg) translate(-50%, 48px)`,
        }}
      >
        {device.name}
      </div>

      {/* Tooltip on hover */}
      <div
        className="absolute bottom-full left-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50"
        style={{
          transform: isEditingLayout
            ? 'translateX(-50%) translateY(-10px)'
            : `rotateZ(${-rotationZ}deg) rotateX(-60deg) translateX(-50%)`
        }}
      >
        <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap shadow-xl">
          <div className="font-semibold">{device.name}</div>
          <div className="text-slate-400">{cfg.label} · Tầng {device.floor} · {!device.room || device.room === 'none' ? 'Chưa phân phòng' : device.room}</div>
          <div className={`mt-1 font-medium ${isOn ? 'text-green-400' : 'text-slate-500'}`}>
            {isOn ? '● Đang bật' : '○ Đang tắt'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Simulation() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const { devices, setDevices, loading, toggling, toggleDevice } = useDeviceStore()

  const [floor,     setFloor]     = useState(1)
  const [selected,  setSelected]  = useState(null)
  const [camInput,  setCamInput]  = useState('')
  const [camFeedUrl, setCamFeedUrl] = useState('')
  const [retryKey,  setRetryKey]  = useState(0)

  const [baseConfig, setBaseConfig] = useState({ width: 680, height: 680, rooms: [], floors: {} })
  const [selection, setSelection] = useState(null)
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [zoom, setZoom] = useState(1)

  const isPointInRotatedRect = (px, py, rx, ry, rw, rh, rotation = 0) => {
    if (!rotation) return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    const cx = rx + rw / 2;
    const cy = ry + rh / 2;
    const tx = px - cx;
    const ty = py - cy;
    const rad = -rotation * (Math.PI / 180);
    const nx = tx * Math.cos(rad) - ty * Math.sin(rad);
    const ny = tx * Math.sin(rad) + ty * Math.cos(rad);
    const finalX = nx + cx;
    const finalY = ny + cy;
    return finalX >= rx && finalX <= rx + rw && finalY >= ry && finalY <= ry + rh;
  };

  const getFloorConfig = (config, f) => {
    if (config.floors && config.floors[f]) return config.floors[f];
    return { width: config.width || 680, height: config.height || 680, shape: 'square' };
  };
  const currentFloorConfig = getFloorConfig(baseConfig, floor);

  const setFloorConfig = (f, updates) => {
    setBaseConfig(prev => {
      const existing = getFloorConfig(prev, f);
      return {
        ...prev,
        floors: {
          ...(prev.floors || {}),
          [f]: { ...existing, ...updates }
        }
      };
    });
  };

  useEffect(() => {
    getFloorPlanConfig().then(r => {
      if (r.data && r.data.width) setBaseConfig(r.data)
    }).catch(() => {})
  }, [])

  const [isEditingLayout, setIsEditingLayout] = useState(false)

  const [rotationZ, setRotationZ] = useState(-45)
  const [isRotating, setIsRotating] = useState(false)
  const rotateRef = useRef({ startX: 0, startRotation: 0 })

  const handleScenePointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.group')) return;
    
    if (isEditingLayout) {
      setSelectedRoomId(null);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / 0.95;
      const y = (e.clientY - rect.top) / 0.95;
      setSelection({ startX: x, startY: y, currentX: x, currentY: y });
      e.currentTarget.setPointerCapture(e.pointerId);
    } else {
      setIsRotating(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      rotateRef.current = { startX: e.clientX, startRotation: rotationZ };
    }
  };

  const handleScenePointerMove = (e) => {
    if (isEditingLayout && selection) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(currentFloorConfig.width, (e.clientX - rect.left) / 0.95));
      const y = Math.max(0, Math.min(currentFloorConfig.height, (e.clientY - rect.top) / 0.95));
      setSelection(prev => ({ ...prev, currentX: x, currentY: y }));
    } else if (isRotating) {
      const deltaX = e.clientX - rotateRef.current.startX;
      setRotationZ(rotateRef.current.startRotation - deltaX * 0.5);
    }
  };

  const handleScenePointerUp = async (e) => {
    if (isRotating) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsRotating(false);
    } else if (isEditingLayout && selection) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      const { startX, startY, currentX, currentY } = selection;
      setSelection(null);
      
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      if (width < 30 || height < 30) return;
      
      const name = prompt("Nhập tên phòng ban (vd: Phòng Marketing):");
      if (!name) return;
      
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      
      const newRoom = {
        id: Date.now().toString(),
        name,
        left: (left / currentFloorConfig.width) * 100,
        top: (top / currentFloorConfig.height) * 100,
        width: (width / currentFloorConfig.width) * 100,
        height: (height / currentFloorConfig.height) * 100,
        floor: floor,
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padEnd(6, '0')
      };
      
      const newConfig = { ...baseConfig, rooms: [...(baseConfig.rooms || []), newRoom] };
      setBaseConfig(newConfig);
      await updateFloorPlanConfig(newConfig).catch(console.error);
      await reassignDevicesRoom(newConfig);
    }
  };

  const { activeCamera, setActiveCamera } = useCameraAI()

  // Hàm tiện ích: Tự động phát hiện phòng dựa trên tọa độ
  const detectRoom = (x, y, floorLevel) => {
    if (!baseConfig || !baseConfig.rooms) return 'none';
    for (const r of baseConfig.rooms) {
      if (r.floor === floorLevel && isPointInRotatedRect(x, y, r.left, r.top, r.width, r.height, r.rotation)) {
        return r.name;
      }
    }
    return 'none';
  };

  const handlePositionChange = async (deviceId, x, y) => {
    const dev = devices.find(d => d.id === deviceId);
    if (!dev) return;
    const updatedSettings = { ...dev.settings, x, y };
    const newRoom = detectRoom(x, y, dev.floor);
    
    // Cập nhật giao diện ngay lập tức
    setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, room: newRoom, settings: updatedSettings } : d));
    
    // Gọi API lưu
    try {
      await updateDevice(deviceId, { room: newRoom, settings: updatedSettings });
    } catch (e) {
      console.error('Lỗi khi lưu vị trí thiết bị', e);
    }
  };

  // Cập nhật lại toàn bộ thiết bị khi mặt bằng phòng bị thay đổi
  const reassignDevicesRoom = async (newConfig) => {
    const updates = [];
    setDevices(prev => prev.map(d => {
      const x = d.settings?.x || 0;
      const y = d.settings?.y || 0;
      let newRoom = 'none';
      for (const r of (newConfig.rooms || [])) {
        if (r.floor === d.floor && isPointInRotatedRect(x, y, r.left, r.top, r.width, r.height, r.rotation)) {
          newRoom = r.name;
          break;
        }
      }
      if (d.room !== newRoom) {
        updates.push({ id: d.id, room: newRoom });
        return { ...d, room: newRoom };
      }
      return d;
    }));

    for (const update of updates) {
      try {
        await updateDevice(update.id, { room: update.room });
      } catch(e) { console.error('Lỗi update room', e); }
    }
  };

  useEffect(() => {
    if (selected?.type === 'camera') {
      setCamInput(selected.ip_address || '')
      setCamFeedUrl(selected.ip_address || '')
    }
  }, [selected?.id])

  async function handleToggle(device) {
    setSelected(device)
    if (device.type !== 'camera' && device.type !== 'sensor') {
      await toggleDevice(device)
    }
  }

  const floorDevices = devices.filter(d => d.floor === floor)
  const onCount      = floorDevices.filter(d => d.status).length
  const totalCount   = floorDevices.length

  return (
    <div className="h-full flex bg-slate-950 text-white overflow-hidden">

      {/* ── Main 3D View ── */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Mô phỏng Không gian 3D
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Smart Office · {totalCount} thiết bị · {onCount} đang bật
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Rotation tip helper */}
            {!isEditingLayout && (
              <div className="text-[11px] text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/30 flex items-center gap-2 select-none animate-pulse">
                <span className="text-cyan-400 font-bold">💡 Tip:</span>
                Kéo chuột trên nền để xoay 360°
              </div>
            )}

            {/* Live indicator */}
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live
            </div>

            {/* Zoom Controls */}
            <div className="flex gap-1 items-center bg-slate-800/80 px-2 py-1.5 rounded-xl border border-slate-700/50">
              <button className="text-slate-400 hover:text-white px-2" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>-</button>
              <span className="text-xs text-cyan-400 font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button className="text-slate-400 hover:text-white px-2" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>+</button>
            </div>

            {/* Floor selector */}
            <div className="flex gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
              {[1, 2, 3].map(f => (
                <button key={f} onClick={() => setFloor(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    floor === f
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}>
                  Tầng {f}
                </button>
              ))}
            </div>
            
            {/* Edit Mode Toggle */}
            {isAdmin && (
              <>
                {isEditingLayout && (
                  <div className="flex gap-2 mr-2 items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/50">
                    {selectedRoomId ? (
                      <>
                        <span className="text-xs text-amber-400 pl-1 font-bold">Phòng:</span>
                        <select className="bg-slate-900 border border-slate-700 text-white text-xs px-1.5 py-1 rounded focus:outline-none"
                                value={baseConfig.rooms.find(r => r.id === selectedRoomId)?.shape || 'square'}
                                onChange={async e => {
                                  const newShape = e.target.value;
                                  const newConfig = { ...baseConfig, rooms: baseConfig.rooms.map(r => r.id === selectedRoomId ? { ...r, shape: newShape } : r) };
                                  setBaseConfig(newConfig);
                                  await updateFloorPlanConfig(newConfig).catch(console.error);
                                }}>
                          <option value="square">Vuông/Chữ nhật</option>
                          <option value="L">Chữ L</option>
                          <option value="U">Chữ U</option>
                          <option value="T">Chữ T</option>
                        </select>
                        
                        <label className="text-xs text-slate-400 ml-2">Xoay:</label>
                        <input type="range" min="0" max="360" step="5" className="w-16 accent-amber-500"
                               value={baseConfig.rooms.find(r => r.id === selectedRoomId)?.rotation || 0}
                               onChange={async e => {
                                 const newRot = Number(e.target.value);
                                 const newConfig = { ...baseConfig, rooms: baseConfig.rooms.map(r => r.id === selectedRoomId ? { ...r, rotation: newRot } : r) };
                                 setBaseConfig(newConfig);
                                 await updateFloorPlanConfig(newConfig).catch(console.error);
                               }} />
                        <span className="text-xs text-amber-400 w-7 text-right">{baseConfig.rooms.find(r => r.id === selectedRoomId)?.rotation || 0}°</span>

                        <button className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs px-2 py-1 ml-2 rounded hover:bg-red-500/40"
                                onClick={async () => {
                                  if (confirm('Xóa phòng này?')) {
                                    const newConfig = { ...baseConfig, rooms: baseConfig.rooms.filter(r => r.id !== selectedRoomId) };
                                    setBaseConfig(newConfig);
                                    setSelectedRoomId(null);
                                    await updateFloorPlanConfig(newConfig).catch(console.error);
                                    await reassignDevicesRoom(newConfig);
                                  }
                                }}>Xóa</button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-cyan-400 pl-1 font-bold">Sàn Tầng {floor}:</span>
                        <select className="bg-slate-900 border border-slate-700 text-white text-xs px-1.5 py-1 rounded focus:outline-none"
                                value={currentFloorConfig.shape || 'square'}
                                onChange={e => setFloorConfig(floor, { shape: e.target.value })}>
                          <option value="square">Vuông/Chữ nhật</option>
                          <option value="L">Chữ L</option>
                          <option value="U">Chữ U</option>
                          <option value="T">Chữ T</option>
                        </select>
                        <label className="text-xs text-slate-400 ml-1">Rộng:</label>
                        <input type="number" className="w-14 bg-slate-900 border border-slate-700 text-white text-xs px-1.5 py-1 rounded" 
                               value={currentFloorConfig.width} 
                               onChange={e => setFloorConfig(floor, { width: Number(e.target.value) })} />
                        <label className="text-xs text-slate-400">Dài:</label>
                        <input type="number" className="w-14 bg-slate-900 border border-slate-700 text-white text-xs px-1.5 py-1 rounded" 
                               value={currentFloorConfig.height} 
                               onChange={e => setFloorConfig(floor, { height: Number(e.target.value) })} />
                      </>
                    )}
                  </div>
                )}
                <button 
                  onClick={async () => {
                    if (isEditingLayout) {
                      await updateFloorPlanConfig(baseConfig).catch(console.error);
                    }
                    setIsEditingLayout(!isEditingLayout);
                  }}
                  className={`px-4 py-1.5 ml-1 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    isEditingLayout 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                      : 'bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:bg-slate-700/80'
                  }`}
                >
                  {isEditingLayout ? 'Xong (Lưu)' : 'Sửa bố cục'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3D Scene */}
        {loading && devices.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Đang tải thiết bị...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center overflow-hidden" style={{ perspective: '2000px' }}
               onWheel={(e) => {
                 // Cho phép cuộn chuột để zoom
                 if (e.deltaY !== 0) {
                   setZoom(prev => Math.max(0.2, Math.min(3, prev - e.deltaY * 0.001)));
                 }
               }}>
            <div
              onPointerDown={handleScenePointerDown}
              onPointerMove={handleScenePointerMove}
              onPointerUp={handleScenePointerUp}
              onPointerCancel={handleScenePointerUp}
              className={`relative select-none ${isRotating ? 'cursor-grabbing' : (isEditingLayout ? 'cursor-crosshair' : 'cursor-grab')}`}
              style={{
                width: currentFloorConfig.width, height: currentFloorConfig.height,
                transform: isEditingLayout 
                  ? `rotateX(0deg) rotateZ(0deg) scale(${0.95 * zoom})` 
                  : `rotateX(58deg) rotateZ(${rotationZ}deg) scale(${zoom})`,
                transformStyle: 'preserve-3d',
                transition: isRotating ? 'none' : 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                className="absolute inset-0 rounded-[48px] border border-cyan-900/20"
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                  backgroundImage: `
                    linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)
                  `,
                  backgroundSize: '60px 60px',
                  boxShadow: '0 40px 120px rgba(0,0,0,0.9), inset 0 1px 0 rgba(34,211,238,0.1)',
                  clipPath: currentFloorConfig.shape === 'L' ? 'polygon(0% 0%, 50% 0%, 50% 50%, 100% 50%, 100% 100%, 0% 100%)' :
                            currentFloorConfig.shape === 'U' ? 'polygon(0% 0%, 30% 0%, 30% 70%, 70% 70%, 70% 0%, 100% 0%, 100% 100%, 0% 100%)' :
                            currentFloorConfig.shape === 'T' ? 'polygon(0% 0%, 100% 0%, 100% 40%, 65% 40%, 65% 100%, 35% 100%, 35% 40%, 0% 40%)' : 'none',
                }}
              />

              {/* Cạnh sàn (độ dày 3D) */}
              <div
                className="absolute inset-0 rounded-[48px] bg-slate-900 border border-slate-800"
                style={{ 
                  transform: 'translateZ(-28px)',
                  clipPath: currentFloorConfig.shape === 'L' ? 'polygon(0% 0%, 50% 0%, 50% 50%, 100% 50%, 100% 100%, 0% 100%)' :
                            currentFloorConfig.shape === 'U' ? 'polygon(0% 0%, 30% 0%, 30% 70%, 70% 70%, 70% 0%, 100% 0%, 100% 100%, 0% 100%)' :
                            currentFloorConfig.shape === 'T' ? 'polygon(0% 0%, 100% 0%, 100% 40%, 65% 40%, 65% 100%, 35% 100%, 35% 40%, 0% 40%)' : 'none',
                }}
              />

              {/* Góc bo sàn */}
              {[0,1,2,3].map(i => (
                <div key={i}
                  className="absolute w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-500/30"
                  style={{
                    top:  i < 2 ? 16 : 'auto', bottom: i >= 2 ? 16 : 'auto',
                    left: i % 2 === 0 ? 16 : 'auto', right: i % 2 === 1 ? 16 : 'auto',
                    transform: 'translateZ(4px)',
                    boxShadow: '0 0 8px rgba(34,211,238,0.4)',
                  }}
                />
              ))}

              {/* Server trung tâm */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div
                  className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-cyan-700/30"
                  style={{
                    transform: `translateZ(${isEditingLayout ? '0px' : '12px'})`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.8), 0 0 30px rgba(34,211,238,0.1)',
                    transition: 'transform 500ms',
                  }}
                >
                  <div style={{ transform: isEditingLayout ? 'rotateX(0deg) rotateZ(0deg)' : `rotateZ(${-rotationZ}deg) rotateX(-60deg)` }}>
                    <Server className="w-8 h-8 text-cyan-700" />
                  </div>
                </div>
                {/* Vòng hào quang server */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse border border-cyan-500/10"
                  style={{ width: 160, height: 160, background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)', transform: 'translateZ(2px) translateX(-50%) translateY(-50%)' }}
                />
              </div>

              {/* Các thiết bị */}
              {floorDevices.map((d, i) => (
                <DeviceNode
                  key={d.id}
                  device={d}
                  index={i}
                  floor={floor}
                  onToggle={handleToggle}
                  isEditingLayout={isEditingLayout}
                  onPositionChange={handlePositionChange}
                  rotationZ={rotationZ}
                />
              ))}

              {/* Các phòng ban (Rooms) */}
              {(baseConfig.rooms || []).filter(r => r.floor === floor).map(r => (
                <div key={r.id} className={`absolute border flex items-center justify-center transition-all group cursor-move ${selectedRoomId === r.id ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 brightness-125' : 'hover:brightness-110'}`}
                     style={{
                       left: `${r.left}%`, top: `${r.top}%`, width: `${r.width}%`, height: `${r.height}%`,
                       backgroundColor: `${r.color}22`, borderColor: `${r.color}88`,
                       transform: `translateZ(1px) rotateZ(${r.rotation || 0}deg)`, zIndex: 1,
                       clipPath: r.shape === 'L' ? 'polygon(0% 0%, 50% 0%, 50% 50%, 100% 50%, 100% 100%, 0% 100%)' :
                                 r.shape === 'U' ? 'polygon(0% 0%, 30% 0%, 30% 70%, 70% 70%, 70% 0%, 100% 0%, 100% 100%, 0% 100%)' :
                                 r.shape === 'T' ? 'polygon(0% 0%, 100% 0%, 100% 40%, 65% 40%, 65% 100%, 35% 100%, 35% 40%, 0% 40%)' : 'none',
                     }}
                     onPointerDown={(e) => {
                       if (!isEditingLayout) return;
                       e.stopPropagation(); // prevent drawing new room
                       setSelectedRoomId(r.id);
                       e.currentTarget.setPointerCapture(e.pointerId);
                       
                       const rect = e.currentTarget.parentNode.getBoundingClientRect();
                       const x = (e.clientX - rect.left) / 0.95;
                       const y = (e.clientY - rect.top) / 0.95;
                       
                       // Xác định các thiết bị nằm trong phòng này
                       const devicesInRoom = floorDevices.filter(d => {
                         const dx = d.settings?.x || 0;
                         const dy = d.settings?.y || 0;
                         return isPointInRotatedRect(dx, dy, r.left, r.top, r.width, r.height, r.rotation);
                       }).map(d => ({ id: d.id, initX: d.settings?.x || 0, initY: d.settings?.y || 0 }));
                       
                       // Store initial click offset in percentage relative to the parent
                       const initialLeft = r.left;
                       const initialTop = r.top;
                       
                       // We can store dragging state in a local variable attached to the event target
                       e.currentTarget.dataset.dragging = "true";
                       e.currentTarget.dataset.startX = x;
                       e.currentTarget.dataset.startY = y;
                       e.currentTarget.dataset.initLeft = initialLeft;
                       e.currentTarget.dataset.initTop = initialTop;
                       e.currentTarget.dataset.dragDevices = JSON.stringify(devicesInRoom);
                     }}
                     onPointerMove={(e) => {
                       if (e.currentTarget.dataset.dragging === "true") {
                         const rect = e.currentTarget.parentNode.getBoundingClientRect();
                         const x = (e.clientX - rect.left) / 0.95;
                         const y = (e.clientY - rect.top) / 0.95;
                         
                         const deltaX = x - parseFloat(e.currentTarget.dataset.startX);
                         const deltaY = y - parseFloat(e.currentTarget.dataset.startY);
                         
                         const deltaPercentX = (deltaX / currentFloorConfig.width) * 100;
                         const deltaPercentY = (deltaY / currentFloorConfig.height) * 100;
                         
                         const newLeft = parseFloat(e.currentTarget.dataset.initLeft) + deltaPercentX;
                         const newTop = parseFloat(e.currentTarget.dataset.initTop) + deltaPercentY;
                         
                         // Temporarily update style for smooth dragging without React re-render lag
                         e.currentTarget.style.left = `${newLeft}%`;
                         e.currentTarget.style.top = `${newTop}%`;
                         e.currentTarget.dataset.currentLeft = newLeft;
                         e.currentTarget.dataset.currentTop = newTop;
                         
                         // Move devices inside room
                         const draggedDevices = JSON.parse(e.currentTarget.dataset.dragDevices || '[]');
                         draggedDevices.forEach(d => {
                           const el = document.getElementById(`device-node-${d.id}`);
                           if (el) {
                             el.style.left = `${d.initX + deltaPercentX}%`;
                             el.style.top = `${d.initY + deltaPercentY}%`;
                           }
                         });
                       }
                     }}
                     onPointerUp={async (e) => {
                       if (e.currentTarget.dataset.dragging === "true") {
                         e.currentTarget.dataset.dragging = "false";
                         e.currentTarget.releasePointerCapture(e.pointerId);
                         const newLeft = parseFloat(e.currentTarget.dataset.currentLeft);
                         const newTop = parseFloat(e.currentTarget.dataset.currentTop);
                         if (!isNaN(newLeft) && !isNaN(newTop)) {
                           // Save devices
                           const deltaPercentX = newLeft - parseFloat(e.currentTarget.dataset.initLeft);
                           const deltaPercentY = newTop - parseFloat(e.currentTarget.dataset.initTop);
                           const draggedDevices = JSON.parse(e.currentTarget.dataset.dragDevices || '[]');
                           
                           if (draggedDevices.length > 0) {
                             setDevices(prev => prev.map(d => {
                               const match = draggedDevices.find(x => x.id === d.id);
                               if (match) {
                                 const updatedSettings = { ...d.settings, x: match.initX + deltaPercentX, y: match.initY + deltaPercentY };
                                 updateDevice(d.id, { settings: updatedSettings }).catch(console.error);
                                 return { ...d, settings: updatedSettings };
                               }
                               return d;
                             }));
                           }

                           const newConfig = { ...baseConfig };
                           const rm = newConfig.rooms.find(x => x.id === r.id);
                           if (rm) {
                             rm.left = newLeft;
                             rm.top = newTop;
                             setBaseConfig(newConfig);
                             await updateFloorPlanConfig(newConfig).catch(console.error);
                             await reassignDevicesRoom(newConfig);
                           }
                         }
                       }
                     }}
                     onPointerCancel={(e) => { e.currentTarget.dataset.dragging = "false"; }}
                     onContextMenu={async (e) => {
                       e.preventDefault();
                       if (!isEditingLayout) return;
                       if (confirm(`Bạn muốn xóa phòng ${r.name}?`)) {
                          const newConfig = { ...baseConfig, rooms: baseConfig.rooms.filter(rm => rm.id !== r.id) };
                          setBaseConfig(newConfig);
                          await updateFloorPlanConfig(newConfig).catch(console.error);
                          await reassignDevicesRoom(newConfig);
                       }
                     }}
                >
                  <span className="text-white/60 font-bold text-xs select-none pointer-events-none drop-shadow-md whitespace-nowrap bg-slate-900/40 px-2 py-0.5 rounded backdrop-blur-sm"
                        style={{ transform: isEditingLayout ? 'none' : `rotateZ(${-rotationZ}deg) rotateX(-20deg)` }}>
                    {r.name}
                  </span>
                </div>
              ))}

              {/* Selection Box */}
              {isEditingLayout && selection && (
                <div className="absolute border-2 border-cyan-400 bg-cyan-400/20 pointer-events-none"
                     style={{
                       left: Math.min(selection.startX, selection.currentX),
                       top: Math.min(selection.startY, selection.currentY),
                       width: Math.abs(selection.currentX - selection.startX),
                       height: Math.abs(selection.currentY - selection.startY),
                       transform: 'translateZ(2px)', zIndex: 100
                     }}
                />
              )}

              {/* Tên tầng */}
              <div
                className="absolute bottom-8 left-1/2 text-xs text-slate-600 font-mono"
                style={{ 
                  transform: isEditingLayout 
                    ? 'translateZ(2px) translateX(-50%) rotateX(0deg) rotateZ(0deg)'
                    : `translateZ(2px) translateX(-50%) rotateZ(${-rotationZ}deg) rotateX(-60deg)` 
                }}
              >
                FLOOR {floor}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 flex-shrink-0">
          {Object.entries(DEVICE_CONFIG).map(([type, cfg]) => {
            const Icon = cfg.icon
            const count = floorDevices.filter(d => d.type === type).length
            if (count === 0) return null
            return (
              <div key={type} className="flex items-center gap-1.5 text-xs text-slate-400">
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                <span>{cfg.label}</span>
                <span className="text-slate-600">({count})</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Side Panel ── */}
      <div className="w-72 bg-slate-900/80 border-l border-slate-800 flex flex-col overflow-hidden flex-shrink-0">

        {/* Stats */}
        <div className="p-4 border-b border-slate-800">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Thống kê tầng {floor}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Đang bật', value: onCount, icon: Zap, color: 'text-green-400' },
              { label: 'Đang tắt', value: totalCount - onCount, icon: ZapOff, color: 'text-slate-500' },
              { label: 'Tổng thiết bị', value: totalCount, icon: Activity, color: 'text-cyan-400' },
              { label: 'Tỉ lệ bật', value: totalCount ? `${Math.round(onCount/totalCount*100)}%` : '0%', icon: ThermometerSun, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/30">
                <s.icon className={`w-4 h-4 ${s.color} mb-1`} />
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Device list */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Danh sách thiết bị
          </p>
          <div className="space-y-2">
            {floorDevices.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-8">Không có thiết bị</p>
            ) : floorDevices.map(d => {
              const cfg  = DEVICE_CONFIG[d.type] || DEVICE_CONFIG.sensor
              const Icon = cfg.icon
              return (
                <div
                  key={d.id}
                  onClick={() => { setSelected(d); cfg.clickable && handleToggle(d) }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer
                    ${selected?.id === d.id
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : 'border-slate-700/30 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600/50'
                    }`}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{
                      background: d.status ? `${cfg.color}22` : 'rgba(71,85,105,0.3)',
                      boxShadow: d.status ? `0 0 10px ${cfg.glow}` : 'none',
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: d.status ? cfg.color : '#64748b' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{d.name}</p>
                    <p className="text-xs text-slate-500">{!d.room || d.room === 'none' ? 'Chưa phân phòng' : d.room}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div
                      className="w-2 h-2 rounded-full transition-all duration-300"
                      style={{
                        background: d.status ? '#4ade80' : '#475569',
                        boxShadow: d.status ? '0 0 6px #4ade80' : 'none',
                      }}
                    />
                    {cfg.clickable && (
                      <div className="flex items-center gap-1">
                        {d.status
                          ? <Wifi className="w-3 h-3 text-green-400" />
                          : <WifiOff className="w-3 h-3 text-slate-600" />
                        }
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Camera Feed Viewer */}
        {selected?.type === 'camera' && (
          <div className="p-4 border-t border-slate-800 flex flex-col gap-3 flex-shrink-0 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Live Camera Feed</p>
              <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                WIFI DIRECT
              </div>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Vd: http://192.168.10.27:8080"
                className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors"
                value={camInput}
                onChange={(e) => setCamInput(e.target.value)}
              />
              <button 
                onClick={() => {
                  let url = camInput.trim();
                  if (url) {
                    // Tự động thêm http:// nếu thiếu
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                      url = 'http://' + url;
                    }
                    // Tách protocol và host/path
                    const parts = url.split('//');
                    if (parts.length > 1) {
                      const domainAndPath = parts[1];
                      const firstSlash = domainAndPath.indexOf('/');
                      // Nếu không có slash nào (chỉ có IP:PORT) hoặc slash ở cuối cùng
                      if (firstSlash === -1 || domainAndPath.substring(firstSlash) === '/') {
                        url = url.replace(/\/$/, '') + '/video';
                        setCamInput(url);
                      }
                    }
                  }
                  setCamFeedUrl(url);
                  setRetryKey(prev => prev + 1);
                  
                  const updatedDevice = { ...selected, ip_address: url };
                  setDevices(prev => prev.map(d => d.id === selected.id ? updatedDevice : d));
                  setSelected(updatedDevice);
                  
                  // Báo cho Provider biết Camera nào đang chạy ngầm
                  setActiveCamera(updatedDevice);
                  
                  // Lưu cứng vào DB để không bị mất khi F5
                  updateDevice(selected.id, { ip_address: url })
                    .catch(e => console.error("Lỗi khi lưu IP Camera vào DB", e));
                }}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Kết nối
              </button>
            </div>
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-700/50 relative shadow-inner">
              {camFeedUrl ? (
                <img 
                  key={`${camFeedUrl}-${retryKey}`}
                  src={`/api/proxy-stream?url=${encodeURIComponent(camFeedUrl)}`} 
                  crossOrigin="anonymous" 
                  alt="Camera Feed" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  onLoad={(e) => { e.target.style.display = 'block'; if(e.target.nextSibling) e.target.nextSibling.style.display = 'none'; }}
                />
              ) : null}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2" style={{ display: camFeedUrl ? 'none' : 'flex' }}>
                <Camera className="w-6 h-6 opacity-50" />
                <span className="text-[10px] font-medium uppercase tracking-widest">No Signal</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              * Tải app <b>IP Webcam</b> trên điện thoại, kết nối cùng mạng WiFi/LAN và nhập địa chỉ luồng video (thường có đuôi /video) vào ô trên.
            </p>
          </div>
        )}

        {/* Quick controls */}
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Điều khiển nhanh</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                const controllable = floorDevices.filter(d => !d.status)
                for (const d of controllable) await handleToggle(d)
              }}
              className="py-2 text-xs font-medium rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors"
            >
              Bật tất cả
            </button>
            <button
              onClick={async () => {
                const controllable = floorDevices.filter(d => d.status)
                for (const d of controllable) await handleToggle(d)
              }}
              className="py-2 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Tắt tất cả
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}