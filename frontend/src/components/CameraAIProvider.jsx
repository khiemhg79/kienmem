import { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { getDevices, controlDevice } from '../services/api';

const CameraContext = createContext();

export function useCameraAI() {
  return useContext(CameraContext);
}

export function CameraAIProvider({ children }) {
  const [activeCamera, setActiveCamera] = useState(null);
  const [model, setModel] = useState(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const lastDetectedRef = useRef(0);

  // Load Model
  useEffect(() => {
    cocoSsd.load().then(m => {
      console.log('🤖 AI Model (coco-ssd) loaded successfully');
      setModel(m);
    }).catch(e => console.error('Lỗi tải mô hình AI', e));
  }, []);

  // Tự động khôi phục camera hoạt động từ localStorage khi mount
  useEffect(() => {
    const savedId = localStorage.getItem('activeCameraId');
    if (savedId) {
      getDevices().then(res => {
        const cam = res.data.find(d => d.id === savedId);
        if (cam && cam.ip_address) {
          console.log("🔌 [AI DEBUG] Tự động khôi phục camera hoạt động:", cam.name, cam.ip_address);
          setActiveCamera(cam);
        }
      }).catch(err => console.error('[AI DEBUG] Lỗi tự động khôi phục camera:', err));
    }
  }, []);

  // Đồng bộ camera hoạt động vào localStorage khi thay đổi
  useEffect(() => {
    if (activeCamera) {
      localStorage.setItem('activeCameraId', activeCamera.id);
    } else {
      localStorage.removeItem('activeCameraId');
    }
  }, [activeCamera]);

  // Background AI Loop
  useEffect(() => {
    if (activeCamera) {
      console.log("📸 [AI DEBUG] Camera hoạt động:", activeCamera.name, activeCamera.ip_address);
    }
  }, [activeCamera]);

  useEffect(() => {
    if (!model) return;
    if (!activeCamera || !activeCamera.ip_address) {
      console.log("💤 [AI DEBUG] Chờ kết nối camera...");
      return;
    }

    console.log("🚀 [AI DEBUG] Khởi động vòng lặp cho:", activeCamera.name);
    let timer;
    let heartbeatCount = 0;

    const detect = async () => {
      if (!model) return;

      // Heartbeat mỗi 5 lần quét
      heartbeatCount++;
      if (heartbeatCount % 5 === 0) {
        console.log("💓 [AI DEBUG] AI đang chạy...");
      }

      if (!imgRef.current || !imgRef.current.complete || imgRef.current.naturalWidth === 0) {
        timer = setTimeout(detect, 1000);
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = imgRef.current.naturalWidth;
        canvas.height = imgRef.current.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgRef.current, 0, 0);
        
        const predictions = await model.detect(canvas);
        const person = predictions.find(p => p.class === 'person' && p.score > 0.4);
        
        if (person) {
          console.log(`👤 [AI DEBUG] PHÁT HIỆN NGƯỜI (${Math.round(person.score * 100)}%)`);
          
          const res = await getDevices();
          const currentCamera = res.data.find(d => d.id === activeCamera.id) || activeCamera;
          const sameFloorDevices = res.data.filter(d => 
            Number(d.floor) === Number(currentCamera.floor)
          );
          
          const aiConfig = currentCamera.settings?.ai_triggers || {
            person_detected: ['door', 'light', 'ac'],
            no_person: ['door', 'light', 'ac'],
            cooldown_seconds: 120
          };
          const personTriggers = aiConfig.person_detected || ['door', 'light', 'ac'];
          
          console.log(`🔍 [AI DEBUG] Tìm thấy ${sameFloorDevices.length} thiết bị cùng tầng ${currentCamera.floor}:`, sameFloorDevices.map(d => `${d.name} (${d.type})`));
          console.log(`⚙️ [AI DEBUG] Cấu hình Bật khi có người:`, personTriggers);
          
          for (const d of sameFloorDevices) {
            if (personTriggers.includes(d.type)) {
              if (!d.status) {
                console.log(`🔓 AI -> KÍCH HOẠT BẬT: ${d.name}`);
                await controlDevice(d.id, { command: 'ON' }).catch(console.error);
              } else {
                console.log(`ℹ️ AI -> Thiết bị đã BẬT sẵn: ${d.name}`);
              }
            }
          }
          lastDetectedRef.current = Date.now();
        } else {
          const now = Date.now();
          if (lastDetectedRef.current !== 0) {
            const secondsSinceLastSeen = (now - lastDetectedRef.current) / 1000;
            
            const res = await getDevices();
            const currentCamera = res.data.find(d => d.id === activeCamera.id) || activeCamera;
            
            const aiConfig = currentCamera.settings?.ai_triggers || {
              person_detected: ['door', 'light', 'ac'],
              no_person: ['door', 'light', 'ac'],
              cooldown_seconds: 120
            };
            const cooldown = Number(aiConfig.cooldown_seconds) || 120;
            const noPersonTriggers = aiConfig.no_person || ['door', 'light', 'ac'];

            // In log vắng người mỗi 3 giây
            if (Math.round(secondsSinceLastSeen) % 3 === 0) {
              console.log(`⏳ [AI DEBUG] Không có người: ${Math.round(secondsSinceLastSeen)}s / ${cooldown}s`);
            }

            if (secondsSinceLastSeen >= cooldown) {
              console.log(`🌑 [AI DEBUG] Đạt giới hạn ${cooldown}s vắng người -> Tiến hành tắt các thiết bị`);
              const sameFloorDevices = res.data.filter(d => 
                Number(d.floor) === Number(currentCamera.floor) && 
                noPersonTriggers.includes(d.type) && 
                d.status === true
              );
              for (const dev of sameFloorDevices) {
                console.log(`💤 AI -> TẮT/ĐÓNG/NGẮT: ${dev.name}`);
                await controlDevice(dev.id, { command: 'OFF' }).catch(console.error);
              }
              lastDetectedRef.current = 0;
            }
          }
        }
      } catch (e) {
        console.error("❌ [AI DEBUG] Lỗi:", e.message);
      }

      timer = setTimeout(detect, 1500);
    };

    detect();
    return () => {
      console.log("🛑 [AI DEBUG] Dừng vòng lặp AI cho:", activeCamera.name);
      clearTimeout(timer);
    };
  }, [model, activeCamera]);

  return (
    <CameraContext.Provider value={{ activeCamera, setActiveCamera }}>
      {children}
      
      {/* Hidden elements for Background AI processing & Streaming */}
      <div style={{ position: 'absolute', left: -9999, top: -9999, opacity: 0 }}>
        {activeCamera && activeCamera.ip_address && (
          <img 
            ref={imgRef}
            src={`/api/proxy-stream?url=${encodeURIComponent(activeCamera.ip_address)}`} 
            crossOrigin="anonymous" 
            alt="AI Hidden Feed" 
          />
        )}
      </div>
    </CameraContext.Provider>
  );
}
