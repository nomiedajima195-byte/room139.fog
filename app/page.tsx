'use client';

import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'room139_fog_local_v2';

export default function Room139Fog90s() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [shakingIds, setShakingIds] = useState<Set<string>>(new Set());
  const [bubbles, setBubbles] = useState<{ id: number, nodeId: string, x: number, color: string }[]>([]);
  
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
        interaction_count: 0,
      };
      saveToLocal([newNode, ...nodes]);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleInteraction = (nodeId: string) => {
    const updatedNodes = nodes.map(n => n.id === nodeId ? { ...n, interaction_count: n.interaction_count + 1 } : n);
    saveToLocal(updatedNodes);
    setShakingIds(prev => new Set(prev).add(nodeId));
    setTimeout(() => {
      setShakingIds(prev => { const next = new Set(prev); next.delete(nodeId); return next; });
    }, 2000);
  };

  const handleShowBubbles = (nodeId: string, count: number) => {
    const colors = ['#f830f8', '#00e0ff', '#ffe000', '#f8f830', '#ffffff'];
    const newBubbles = Array.from({ length: Math.min(count, 50) }).map(() => ({
      id: Math.random(),
      nodeId: nodeId,
      x: Math.random() * 80 + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setBubbles(prev => [...prev.slice(-100), ...newBubbles]);
    setTimeout(() => {
      const ids = new Set(newBubbles.map(b => b.id));
      setBubbles(prev => prev.filter(b => !ids.has(b.id)));
    }, 2500);
  };

  return (
    // h-screenの代わりに h-[100dvh] を使用してスマホのアドレスバー問題を回避
    <div className="h-[100dvh] w-full relative overflow-hidden flex flex-col font-sans text-xs bg-[#b19cd9]">
      <style jsx global>{`
        @keyframes rhythmShake {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes bubbleUp {
          0% { transform: translateY(10px) scale(0.5); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translateY(-180px) scale(1.6); opacity: 0; }
        }
        .animate-slow-shake { animation: rhythmShake 2s ease-in-out 1; }
        .animate-bubble-pixel { animation: bubbleUp 2.5s forwards ease-out; }
        .bevel-3d { box-shadow: inset 1px 1px 0 white, inset -1px -1px 0 #808080; }
        .bevel-3d-inset { box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 white; }
        .shadow-hard { box-shadow: 4px 4px 0 #000000; }
        .control-90s { @apply bevel-3d bg-[#c0c0c0] active:bevel-3d-inset; }
      `}</style>

      {/* 固定ヘッダー */}
      <header className="shrink-0 z-50 h-8 bg-[#000080] m-1 shadow-hard flex items-center justify-between px-2">
        <div className="flex items-center text-white font-bold space-x-2">
          <div className="w-3 h-3 border border-white/50 bg-white/20" />
          <h1 className="text-[10px] tracking-widest uppercase">room139.fog</h1>
        </div>
        <div className="flex space-x-1">
          <div className="w-4 h-4 control-90s flex items-center justify-center text-[8px]">_</div>
          <div className="w-4 h-4 control-90s flex items-center justify-center text-[8px]">✕</div>
        </div>
      </header>

      {/* メインエリア：ここだけスクロール */}
      <main className="flex-1 overflow-y-auto p-4 space-y-16 pb-32">
        {nodes.map((node) => (
          <div key={node.id} className="relative w-full flex flex-col items-center">
            <div className={`relative w-full max-w-[320px] aspect-square transition-transform ${shakingIds.has(node.id) ? 'animate-slow-shake' : ''}`}>
              
              <div className="absolute inset-0 bg-[#c0c0c0] p-1 shadow-hard control-90s">
                <img src={node.image_url} className="w-full h-full object-cover" alt="" style={{ imageRendering: 'pixelated' }} />
              </div>

              {/* 画像下のボタンエリア */}
              <div className="absolute -bottom-10 left-0 flex space-x-2 z-40">
                <button onClick={() => handleInteraction(node.id)} className="w-10 h-10 control-90s shadow-hard flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                  <div className="w-4 h-4 rounded-full bg-black/60" />
                </button>
                <button onClick={() => handleShowBubbles(node.id, node.interaction_count)} className="px-4 h-10 control-90s shadow-hard font-bold text-[10px] uppercase transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                  view
                </button>
              </div>

              <button onClick={() => saveToLocal(nodes.filter(n => n.id !== node.id))} className="absolute top-2 right-2 w-5 h-5 control-90s flex items-center justify-center text-[8px] font-bold">✕</button>

              <div className="absolute top-0 left-0 right-0 h-0 pointer-events-none">
                {bubbles.filter(b => b.nodeId === node.id).map(b => (
                  <div key={b.id} className="absolute animate-bubble-pixel w-5 h-5 rounded-full blur-[1px] mix-blend-screen" style={{ left: `${b.x}%`, backgroundColor: b.color }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* 固定フッター */}
      <footer className="shrink-0 z-50 h-24 bg-[#c0c0c0] bevel-3d-inset shadow-[0_-4px_0_#000000] flex flex-col items-center justify-center p-2">
        <label className="w-40 h-10 control-90s shadow-hard flex items-center justify-center cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
          <span className="text-xl font-bold text-[#000080]">＋ ADD FILE</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
        <p className="mt-2 text-[8px] text-black/40 font-bold uppercase tracking-[0.3em]">Local File System 199x</p>
      </footer>
    </div>
  );
}