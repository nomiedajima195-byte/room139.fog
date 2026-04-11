'use client';

import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'room139_fog_accumulation_v1';

type Node = {
  id: string;
  image_url: string;
  created_at: string;
  interaction_count: number;
};

// --- [自作] 90sビットマップ風：雲と霧（SVG） ---

// [●ボタン用] 小さなドットの雲
const PixelCloudIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
    <rect x="10" y="10" width="8" height="4" fill="black" fillOpacity="0.6"/>
    <rect x="8" y="12" width="12" height="6" fill="black" fillOpacity="0.6"/>
    <rect x="6" y="14" width="16" height="4" fill="black" fillOpacity="0.6"/>
  </svg>
);

// [浮かび上がる用] 霧の断片（ぼやけたドット）
const PixelFogParticle = ({ color }: { color: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
    <rect x="8" y="12" width="16" height="8" fill={color}/>
    <rect x="10" y="10" width="12" height="12" fill={color}/>
    <rect x="14" y="8" width="4" height="16" fill={color}/>
  </svg>
);

// [共通] ドットシルエットアイコン
const PixelUserIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="11" y="7" width="10" height="10" fill="#000080" fillOpacity="0.8"/>
        <rect x="7" y="17" width="18" height="8" fill="#000080" fillOpacity="0.8"/>
    </svg>
);

export default function Room139Fog90s() {
  const [viewMode, setViewMode] = useState<'FEED' | 'MY_PAGE'>('FEED');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [shakingIds, setShakingIds] = useState<Set<string>>(new Set());
  const [floatingFog, setFloatingFog] = useState<{ id: number, nodeId: string, x: number, delay: number, color: string }[]>([]);
  const [cooldowns, setCooldowns] = useState<Set<string>>(new Set());

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

  // --- [1] 雲を押す（目に見えない湿気/FOGの素を溜める） ---
  const handleAddVapor = (nodeId: string) => {
    const updatedNodes = nodes.map(n => 
      n.id === nodeId ? { ...n, interaction_count: (n.interaction_count || 0) + 1 } : n
    );
    saveToLocal(updatedNodes);

    // わずかに画像が揺れる（空気が震えるようなイメージ）
    setShakingIds(prev => new Set(prev).add(nodeId));
    setTimeout(() => setShakingIds(prev => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    }), 500);
  };

  // --- [2] FOGボタン（溜まった湿気を霧として解放する） ---
  const handleTriggerFog = (nodeId: string, count: number) => {
    if (cooldowns.has(nodeId)) return;

    setCooldowns(prev => new Set(prev).add(nodeId));

    // 霧の色（白からグレーのグラデーション）
    const colors = ['#ffffffcc', '#e0e0e0bb', '#d0d0d0aa', '#ffffff99'];
    const releaseCount = count > 0 ? Math.min(count, 45) : 1;

    const newFog = Array.from({ length: releaseCount }).map((_, i) => ({
      id: Math.random(),
      nodeId: nodeId,
      x: Math.random() * 90 + 5,
      delay: i * 0.07,
      color: colors[i % colors.length],
    }));

    setFloatingFog(prev => [...prev.slice(-250), ...newFog]);

    // 3秒間のクールダウン
    setTimeout(() => {
      setCooldowns(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }, 3000);

    setTimeout(() => {
      const ids = new Set(newFog.map(f => f.id));
      setFloatingFog(prev => prev.filter(f => !ids.has(f.id)));
    }, 3000);

    // 放出したのでリセット
    const resetNodes = nodes.map(n => n.id === nodeId ? { ...n, interaction_count: 0 } : n);
    saveToLocal(resetNodes);
  };

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

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden flex flex-col bg-[#b19cd9]">
      <link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet" />
      
      <style jsx global>{`
        * { font-family: 'DotGothic16', sans-serif !important; -webkit-font-smoothing: none !important; }
        svg { image-rendering: pixelated; }

        @keyframes subtleVibration {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }
        @keyframes fogFloat {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(-450px) scale(3); opacity: 0; }
        }
        .animate-vibrate { animation: subtleVibration 0.5s ease-in-out 1; }
        .animate-fog-float { animation: fogFloat 2.5s forwards ease-out; }
        
        .bevel-3d { box-shadow: inset 1px 1px 0 white, inset -1px -1px 0 #808080; }
        .bevel-3d-inset { box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 white; }
        .shadow-hard { box-shadow: 4px 4px 0 #000000; }
        .control-90s { @apply bevel-3d bg-[#c0c0c0] active:bevel-3d-inset; }
        .win-titlebar { @apply bg-[#000080] text-white font-bold flex items-center px-2; }
      `}</style>

      <header className="shrink-0 z-50 h-8 win-titlebar m-1 shadow-hard">
        <h1 className="text-[12px] uppercase tracking-tighter">room139.fog</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-24 pb-48">
        {viewMode === 'MY_PAGE' ? (
          <div className="w-full max-w-[400px] mx-auto space-y-6 pt-4">
             <div className="control-90s p-4 shadow-hard flex flex-col items-center">
                <div className="w-20 h-20 bevel-3d-inset p-1 bg-white mb-2">
                   <div className="w-full h-full bg-[#c0c0c0] flex items-center justify-center">
                       <PixelUserIcon />
                   </div>
                </div>
                <h2 className="text-[16px] text-[#000080] font-bold uppercase tracking-widest">kurata.fog</h2>
             </div>
             <div className="grid grid-cols-2 gap-4">
                {nodes.map(n => (
                  <div key={n.id} className="control-90s p-1 shadow-hard aspect-square">
                    <img src={n.image_url} className="w-full h-full object-cover grayscale opacity-30" style={{ imageRendering: 'pixelated' }} />
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-24">
            {nodes.map((node) => (
              <div key={node.id} className="relative w-full flex flex-col items-center">
                <div className={`relative w-full max-w-[320px] aspect-square ${shakingIds.has(node.id) ? 'animate-vibrate' : ''}`}>
                  <div className="absolute inset-0 bg-[#c0c0c0] p-1 shadow-hard control-90s">
                    <img src={node.image_url} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                  </div>
                  
                  <div className="absolute -bottom-12 left-0 flex space-x-2 z-40">
                    {/* [雲ボタン] 気配を溜める */}
                    <button 
                      onClick={() => handleAddVapor(node.id)} 
                      className="w-12 h-12 control-90s shadow-hard flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    >
                      <PixelCloudIcon />
                    </button>
                    
                    {/* [FOGボタン] 解放 */}
                    <button 
                      onClick={() => handleTriggerFog(node.id, node.interaction_count || 0)} 
                      disabled={cooldowns.has(node.id)}
                      className={`relative px-10 h-12 shadow-hard font-bold text-[14px] uppercase tracking-[0.4em] transition-all
                        ${cooldowns.has(node.id) 
                          ? 'bevel-3d-inset bg-[#d8d8d8] text-gray-500 translate-x-0.5 translate-y-0.5 shadow-none' 
                          : 'control-90s active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'}`}
                    >
                      {cooldowns.has(node.id) ? '....' : 'Fog'}

                      {/* 霧のアニメーション */}
                      <div className="absolute top-0 left-0 w-full h-0 pointer-events-none z-30">
                        {floatingFog.filter(f => f.nodeId === node.id).map(f => (
                          <div key={f.id} className="absolute animate-fog-float flex items-center justify-center" style={{ left: `${f.x}%`, animationDelay: `${f.delay}s` }}>
                            <PixelFogParticle color={f.color} />
                          </div>
                        ))}
                      </div>
                    </button>
                  </div>
                  <button onClick={() => saveToLocal(nodes.filter(n => n.id !== node.id))} className="absolute -top-1 -right-1 w-6 h-6 control-90s flex items-center justify-center text-[10px] font-bold">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="shrink-0 z-50 h-24 bg-[#c0c0c0] bevel-3d-inset shadow-[0_-4px_0_#000000] flex items-center justify-around p-2">
        <button onClick={() => setViewMode('FEED')} className={`w-20 h-10 control-90s shadow-hard font-bold text-[10px] ${viewMode === 'FEED' ? 'bevel-3d-inset' : ''}`}>FEED</button>
        <label className="w-24 h-10 control-90s shadow-hard flex items-center justify-center cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
          <span className="text-[12px] font-bold text-[#000080] tracking-tighter">＋ picture</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
        <button onClick={() => setViewMode('MY_PAGE')} className={`w-20 h-10 control-90s shadow-hard font-bold text-[10px] ${viewMode === 'MY_PAGE' ? 'bevel-3d-inset' : ''}`}>MY_PAGE</button>
      </footer>
    </div>
  );
}