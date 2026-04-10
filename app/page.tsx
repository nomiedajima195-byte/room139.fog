'use client';

import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'room139_fog_v2_final';

type Node = {
  id: string;
  image_url: string;
  created_at: string;
  interaction_count: number;
};

type ViewMode = 'FEED' | 'MY_PAGE';

export default function Room139Fog90s() {
  const [viewMode, setViewMode] = useState<ViewMode>('FEED');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [shakingIds, setShakingIds] = useState<Set<string>>(new Set());
  const [bubbles, setBubbles] = useState<{ id: number, nodeId: string, x: number, color: string }[]>([]);
  
  // ユーザー情報（仮：SNS化の際はここを動的に）
  const [user] = useState({
    name: 'kurata.fog',
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // 暫定ダミー
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setNodes(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveToLocal = (newNodes: Node[]) => {
    setNodes(newNodes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newNodes));
  };

  // --- 画像アップロード処理 ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const newNode: Node = {
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

  // --- ●ボタン（揺れ） ---
  const handleInteraction = (nodeId: string) => {
    const updatedNodes = nodes.map(n => n.id === nodeId ? { ...n, interaction_count: n.interaction_count + 1 } : n);
    saveToLocal(updatedNodes);
    setShakingIds(prev => new Set(prev).add(nodeId));
    setTimeout(() => {
      setShakingIds(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }, 2000);
  };

  // --- VIEWボタン（泡：ボタン起点） ---
  const handleShowBubbles = (nodeId: string, count: number) => {
    const colors = ['#f830f8', '#00e0ff', '#ffe000', '#f8f830', '#ffffff'];
    const newBubbles = Array.from({ length: Math.min(count + 1, 20) }).map(() => ({
      id: Math.random(),
      nodeId: nodeId,
      x: Math.random() * 60 + 20,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setBubbles(prev => [...prev.slice(-150), ...newBubbles]);
    setTimeout(() => {
      const ids = new Set(newBubbles.map(b => b.id));
      setBubbles(prev => prev.filter(b => !ids.has(b.id)));
    }, 2500);
  };

  const deleteNode = (id: string) => {
    if (confirm("このノードを霧に返しますか？")) {
      saveToLocal(nodes.filter(n => n.id !== id));
    }
  };

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden flex flex-col bg-[#b19cd9]">
      <link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet" />
      
      <style jsx global>{`
        * {
          font-family: 'DotGothic16', sans-serif !important;
          -webkit-font-smoothing: none !important;
          text-rendering: pixelated !important;
        }
        @keyframes rhythmShake {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes bubbleUpFromButton {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translateY(-350px) scale(2.0); opacity: 0; }
        }
        .animate-slow-shake { animation: rhythmShake 2s ease-in-out 1; }
        .animate-bubble-from-btn { animation: bubbleUpFromButton 2.5s forwards ease-out; }
        
        .bevel-3d { box-shadow: inset 1px 1px 0 white, inset -1px -1px 0 #808080; }
        .bevel-3d-inset { box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 white; }
        .shadow-hard { box-shadow: 4px 4px 0 #000000; }
        .control-90s { @apply bevel-3d bg-[#c0c0c0] active:bevel-3d-inset; }
        .win-titlebar { @apply bg-[#000080] text-white font-bold flex items-center justify-between px-2; }
      `}</style>

      {/* ヘッダー */}
      <header className="shrink-0 z-50 h-8 win-titlebar m-1 shadow-hard">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 border border-white/50 bg-white/20" />
          <h1 className="text-[12px] tracking-tighter uppercase cursor-pointer" onClick={() => setViewMode('FEED')}>
            room139.fog {viewMode === 'MY_PAGE' && ' - PROFILE'}
          </h1>
        </div>
        <div className="flex space-x-1">
          <div className="w-4 h-4 control-90s flex items-center justify-center text-[10px]">_</div>
          <div className="w-4 h-4 control-90s flex items-center justify-center text-[10px]">✕</div>
        </div>
      </header>

      {/* メインエリア */}
      <main className="flex-1 overflow-y-auto p-4 space-y-20 pb-40">
        
        {viewMode === 'MY_PAGE' ? (
          /* --- マイページ --- */
          <div className="w-full max-w-[400px] mx-auto space-y-6">
            <div className="control-90s p-4 shadow-hard flex flex-col items-center">
              <div className="w-20 h-20 bevel-3d-inset p-1 bg-white mb-4">
                <img src={user.icon} alt="icon" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              </div>
              <h2 className="text-[18px] text-[#000080] font-bold">{user.name}</h2>
              <button className="mt-4 px-6 h-10 control-90s shadow-hard text-[14px] font-bold active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                CHECK
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {nodes.map((node) => (
                <div key={node.id} className="control-90s p-1 shadow-hard aspect-square">
                  <img src={node.image_url} className="w-full h-full object-cover opacity-60" style={{ imageRendering: 'pixelated' }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* --- フィード --- */
          <div className="flex flex-col items-center space-y-20">
            {nodes.map((node) => (
              <div key={node.id} className="relative w-full flex flex-col items-center">
                <div className={`relative w-full max-w-[320px] aspect-square transition-transform ${shakingIds.has(node.id) ? 'animate-slow-shake' : ''}`}>
                  <div className="absolute inset-0 bg-[#c0c0c0] p-1 shadow-hard control-90s">
                    <img src={node.image_url} className="w-full h-full object-cover" alt="" style={{ imageRendering: 'pixelated' }} />
                  </div>
                  <div className="absolute -bottom-12 left-0 flex space-x-2 z-40">
                    <button onClick={() => handleInteraction(node.id)} className="w-12 h-12 control-90s shadow-hard flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                      <div className="w-5 h-5 rounded-full bg-black/70" />
                    </button>
                    <button onClick={() => handleShowBubbles(node.id, node.interaction_count)} className="relative px-5 h-12 control-90s shadow-hard font-bold text-[14px] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                      VIEW
                      <div className="absolute top-0 left-0 w-full h-0 pointer-events-none">
                        {bubbles.filter(b => b.nodeId === node.id).map(b => (
                          <div key={b.id} className="absolute animate-bubble-from-btn w-4 h-4 rounded-full blur-[1px] mix-blend-screen" style={{ left: `${b.x}%`, backgroundColor: b.color }} />
                        ))}
                      </div>
                    </button>
                  </div>
                  <button onClick={() => deleteNode(node.id)} className="absolute top-2 right-2 w-6 h-6 control-90s flex items-center justify-center text-[12px] font-bold">✕</button>
                </div>
              </div>
            ))}
            {nodes.length === 0 && <p className="text-[12px] text-black/50 tracking-widest mt-20">NO FOG DATA</p>}
          </div>
        )}
      </main>

      {/* 固定フッター */}
      <footer className="shrink-0 z-50 h-28 bg-[#c0c0c0] bevel-3d-inset shadow-[0_-4px_0_#000000] flex items-center justify-around p-2">
        <button onClick={() => setViewMode('FEED')} className={`w-16 h-12 control-90s shadow-hard font-bold text-[10px] ${viewMode === 'FEED' ? 'bevel-3d-inset bg-[#e0e0e0]' : ''}`}>FEED</button>
        <label className="w-32 h-12 control-90s shadow-hard flex items-center justify-center cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
          <span className="text-[14px] font-bold text-[#000080] tracking-tighter">＋ picture</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
        <button onClick={() => setViewMode('MY_PAGE')} className={`w-16 h-12 control-90s shadow-hard font-bold text-[10px] ${viewMode === 'MY_PAGE' ? 'bevel-3d-inset bg-[#e0e0e0]' : ''}`}>MY_PAGE</button>
      </footer>

      {isUploading && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-[#c0c0c0] p-4 shadow-hard control-90s">
            <p className="text-[10px] tracking-[0.2em] text-[#000080] animate-pulse font-bold">INHALING PICTURE...</p>
          </div>
        </div>
      )}
    </div>
  );
}