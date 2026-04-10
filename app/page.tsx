'use client';

import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'room139_fog_local_data';

export default function Room139Fog90s() {
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
      setShakingIds(prev => new Set(prev).add(nodeId));
      lastTapTime.current[nodeId] = 0;
    } else {
      spawnBubble(nodeId);
      lastTapTime.current[nodeId] = now;
    }
  };

  const stopShaking = (nodeId: string) => {
    setShakingIds(prev => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });
  };

  const spawnBubble = (nodeId: string) => {
    const colors = ['#f830f8', '#00e0ff', '#ffe000', '#f8f830', '#ffffff'];
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
    <div className="min-h-screen relative overflow-x-hidden selection:bg-none font-sans text-xs">
      <style jsx global>{`
        body {
          background-color: #b19cd9;
          margin: 0;
          color: black;
        }
        @keyframes slowShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(1.5deg); }
          75% { transform: rotate(-1.5deg); }
        }
        @keyframes bubbleUp {
          0% { transform: translateY(10px) scale(0.5); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translateY(-200px) scale(1.8); opacity: 0; }
        }
        .animate-slow-shake-3 { 
          animation: slowShake 2s ease-in-out; 
          animation-iteration-count: 3; 
        }
        .animate-bubble-pixel { 
          animation: bubbleUp 2.5s forwards ease-out; 
        }
        .bevel-3d {
          box-shadow: inset 1px 1px 0 white, inset -1px -1px 0 #808080;
        }
        .bevel-3d-inset {
          box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 white;
        }
        .shadow-hard {
          box-shadow: 4px 4px 0 rgba(0,0,0,0.8);
        }
        .control-90s {
          @apply bevel-3d bg-[#d1d1d1] active:bevel-3d-inset;
        }
      `}</style>

      {/* ヘッダー：room139.fog */}
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none p-2">
        <div className="flex items-center justify-between h-7 bg-[#000080] px-2 pointer-events-auto shadow-hard">
          <div className="flex items-center text-white font-bold">
            <div className="w-3 h-3 bg-white/20 mr-2 flex items-center justify-center">
              <div className="w-1 h-1 bg-white" />
            </div>
            {/* ここを room139.fog に戻しました */}
            <h1 className="text-[10px] tracking-widest uppercase">room139.fog</h1>
          </div>
          <div className="flex space-x-1">
            <div className="w-4 h-4 control-90s flex items-center justify-center text-[8px]">_</div>
            <div className="w-4 h-4 control-90s flex items-center justify-center text-[8px]">✕</div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center pt-24 pb-64 space-y-12">
        {nodes.map((node) => (
          <div 
            key={node.id} 
            className="relative w-full max-w-[100vw] aspect-square flex items-center justify-center"
          >
            <div 
              className={`relative w-[92%] h-[92%] transition-transform duration-500 ${shakingIds.has(node.id) ? 'animate-slow-shake-3' : ''}`}
              onAnimationEnd={() => stopShaking(node.id)}
            >
              <div 
                className="absolute inset-0 bg-[#d1d1d1] p-1 shadow-hard cursor-pointer control-90s"
                onClick={() => handleInteraction(node.id)}
              >
                <img 
                  src={node.image_url} 
                  className="w-full h-full object-cover opacity-95 transition-opacity duration-700 hover:opacity-100" 
                  alt="fog node"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <div className="absolute top-0 left-0 right-0 h-0 pointer-events-none z-30">
                {bubbles.filter(b => b.nodeId === node.id).map(b => (
                  <div
                    key={b.id}
                    className="absolute animate-bubble-pixel w-6 h-6 rounded-full blur-[2px] mix-blend-screen"
                    style={{ left: `${b.x}%`, backgroundColor: b.color }}
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm("消去？")) saveToLocal(nodes.filter(n => n.id !== node.id)); }}
              className="absolute top-0 right-4 z-40 w-6 h-6 control-90s shadow-hard flex items-center justify-center text-black active:shadow-none translate-y-[-50%]"
            >✕</button>
          </div>
        ))}
      </main>

      <nav className="fixed bottom-12 left-0 right-0 flex flex-col items-center z-50 pointer-events-none">
        <label className="group relative w-32 h-10 flex items-center justify-center cursor-pointer control-90s shadow-hard pointer-events-auto active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
          <span className="text-2xl font-light text-[#000080]">＋</span>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </label>
        <p className="mt-4 text-[8px] text-black/30 tracking-[0.5em] uppercase font-bold">Local Syncing...</p>
      </nav>

      {isUploading && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-md z-[100] flex items-center justify-center">
          <div className="bg-[#d1d1d1] p-4 shadow-hard control-90s">
            <p className="text-[10px] tracking-[0.2em] text-[#000080] animate-pulse">
              INHALING...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}