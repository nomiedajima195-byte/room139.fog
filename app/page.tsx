'use client';

import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'room139_fog_local_data';

export default function Room139FogLocal() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [shakingIds, setShakingIds] = useState<Set<string>>(new Set());
  const [bubbles, setBubbles] = useState<{ id: number, nodeId: string, x: number, color: string }[]>([]);
  
  const lastTapTime = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setNodes(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveToLocal = (newNodes: any[]) => {
    setNodes(newNodes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newNodes));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const newNode = {
        id: `node-${Date.now()}`,
        image_url: event.target?.result as string,
        created_at: new Date().toISOString(),
      };
      saveToLocal([newNode, ...nodes]);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleInteraction = (nodeId: string) => {
    const now = Date.now();
    const last = lastTapTime.current[nodeId] || 0;

    if (now - last < 300) {
      setShakingIds(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) next.delete(nodeId);
        else next.add(nodeId);
        return next;
      });
      lastTapTime.current[nodeId] = 0;
    } else {
      spawnBubble(nodeId);
      lastTapTime.current[nodeId] = now;
    }
  };

  const spawnBubble = (nodeId: string) => {
    const colors = ['#FFD1DC', '#BFFCC6', '#D5AAFF', '#FFFFD1', '#AFE4FF'];
    const newBubble = {
      id: Date.now() + Math.random(),
      nodeId: nodeId,
      x: Math.random() * 80 + 10, 
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    setBubbles(prev => [...prev.slice(-149), newBubble]);

    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== newBubble.id));
    }, 2500);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-none">
      <style jsx global>{`
        body {
          background: linear-gradient(125deg, #e0c3fc 0%, #8ec5fc 100%);
          background-attachment: fixed;
          margin: 0;
        }
        /* 4/4拍子を意識したリズム。2秒で1ループ（BPM120の2小節分、あるいはBPM60の1小節分に相当） */
        @keyframes rhythmShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
        @keyframes bubbleUp {
          0% { transform: translateY(10px) scale(0.5); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translateY(-250px) scale(1.8); opacity: 0; }
        }
        .animate-rhythm-shake { animation: rhythmShake 2s infinite ease-in-out; }
        .animate-bubble { animation: bubbleUp 2.5s forwards ease-out; }
      `}</style>

      <header className="fixed top-6 left-6 z-50 mix-blend-difference pointer-events-none">
        <h1 className="text-white/40 text-[10px] tracking-[0.5em] font-light uppercase">room139.fog</h1>
      </header>

      <main className="relative z-10 flex flex-col items-center">
        {nodes.map((node) => (
          <div 
            key={node.id} 
            className="relative w-full max-w-[100vw] aspect-square flex items-center justify-center py-2"
          >
            {/* アニメーションクラスをリズム仕様に変更 */}
            <div className={`relative w-[95%] h-[95%] transition-transform duration-500 ${shakingIds.has(node.id) ? 'animate-rhythm-shake' : ''}`}>
              
              <div 
                className="absolute inset-0 rounded-[12px] shadow-2xl overflow-hidden cursor-pointer"
                onClick={() => handleInteraction(node.id)}
              >
                <img 
                  src={node.image_url} 
                  className="w-full h-full object-cover opacity-95 transition-opacity duration-700 hover:opacity-100" 
                  alt="fog node"
                />
              </div>

              <div className="absolute top-0 left-0 right-0 h-0 pointer-events-none z-30">
                {bubbles.filter(b => b.nodeId === node.id).map(b => (
                  <div
                    key={b.id}
                    className="absolute animate-bubble w-10 h-10 rounded-full blur-[6px] mix-blend-screen"
                    style={{ left: `${b.x}%`, backgroundColor: b.color }}
                  />
                ))}
              </div>

            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm("消去？")) saveToLocal(nodes.filter(n => n.id !== node.id)); }}
              className="absolute top-6 right-6 z-40 text-white/20 hover:text-white/80 p-2 text-xs"
            >✕</button>
          </div>
        ))}
      </main>

      <nav className="fixed bottom-10 left-0 right-0 flex flex-col items-center z-50 pointer-events-none">
        <label className="w-16 h-16 flex items-center justify-center cursor-pointer bg-white/90 backdrop-blur rounded-full shadow-2xl border border-white/20 active:scale-90 transition-transform pointer-events-auto">
          <span className="text-2xl font-light text-blue-300">+</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
        <p className="mt-4 text-[8px] text-white/30 tracking-[1em] uppercase">local</p>
      </nav>

      {isUploading && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-3xl z-[100] flex items-center justify-center text-[10px] tracking-[1em] text-blue-400 animate-pulse uppercase">
          Inhaling...
        </div>
      )}
    </div>
  );
}