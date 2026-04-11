'use client';

import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'room139_fog_non_quantified';

type Node = {
  id: string;
  image_url: string;
  created_at: string;
  interaction_count: number;
};

export default function Room139Fog90s() {
  const [viewMode, setViewMode] = useState<'FEED' | 'MY_PAGE'>('FEED');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [shakingIds, setShakingIds] = useState<Set<string>>(new Set());
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number, nodeId: string, x: number, delay: number, glyph: string, color: string }[]>([]);
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

  // --- [1] 猫を押す（数値は見えないが、内部で気配が溜まる） ---
  const handleAddCount = (nodeId: string) => {
    const updatedNodes = nodes.map(n => 
      n.id === nodeId ? { ...n, interaction_count: (n.interaction_count || 0) + 1 } : n
    );
    saveToLocal(updatedNodes);

    // わずかに画像が揺れる（すり寄られた感触）
    setShakingIds(prev => new Set(prev).add(nodeId));
    setTimeout(() => setShakingIds(prev => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    }), 400);
  };

  // --- [2] MOHUボタン（溜まった気配を一気に解放する儀式） ---
  const handleTriggerMOHU = (nodeId: string, count: number) => {
    if (cooldowns.has(nodeId)) return;

    setCooldowns(prev => new Set(prev).add(nodeId));

    const emojis = ['🐈', '🐾', '🐈‍⬛'];
    const colors = ['#ffffff', '#000000bb', '#808080'];
    
    // 放出する猫の数。溜まっていなくても1匹は出るように。
    const releaseCount = count > 0 ? Math.min(count, 40) : 1;

    const newEmojis = Array.from({ length: releaseCount }).map((_, i) => ({
      id: Math.random(),
      nodeId: nodeId,
      x: Math.random() * 80 + 10,
      delay: i * 0.08,
      glyph: emojis[i % emojis.length],
      color: colors[i % colors.length],
    }));

    setFloatingEmojis(prev => [...prev.slice(-200), ...newEmojis]);

    // 3秒の沈黙
    setTimeout(() => {
      setCooldowns(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }, 3000);

    setTimeout(() => {
      const ids = new Set(newEmojis.map(e => e.id));
      setFloatingEmojis(prev => prev.filter(e => !ids.has(e.id)));
    }, 3000);

    // 解放したのでカウントをリセット（任意ですが、空にする方が「出し切った感」が出ます）
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
        .pixel-glyph { filter: grayscale(100%) brightness(0.1) contrast(1.2); image-rendering: pixelated; }
        
        @keyframes rhythmShake {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1deg); }
        }
        @keyframes glyphSwipe {
          0% { transform: translate(-30px, 0) scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          50% { transform: translate(10px, -180px) scale(1.5); }
          100% { transform: translate(40px, -400px) scale(0.4); opacity: 0; }
        }
        .animate-slow-shake { animation: rhythmShake 0.4s ease-in-out 1; }
        .animate-glyph-swipe { animation: glyphSwipe 2s forwards ease-out; }
        
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
                   <div className="w-full h-full bg-[#c0c0c0] flex items-center justify-center text-[24px] pixel-glyph">👤</div>
                </div>
                <h2 className="text-[16px] text-[#000080] font-bold">kurata.fog</h2>
             </div>
             <div className="grid grid-cols-2 gap-4">
                {nodes.map(n => (
                  <div key={n.id} className="control-90s p-1 shadow-hard aspect-square">
                    <img src={n.image_url} className="w-full h-full object-cover grayscale opacity-40" style={{ imageRendering: 'pixelated' }} />
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-24">
            {nodes.map((node) => (
              <div key={node.id} className="relative w-full flex flex-col items-center">
                <div className={`relative w-full max-w-[320px] aspect-square ${shakingIds.has(node.id) ? 'animate-slow-shake' : ''}`}>
                  <div className="absolute inset-0 bg-[#c0c0c0] p-1 shadow-hard control-90s">
                    <img src={node.image_url} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                  </div>
                  
                  <div className="absolute -bottom-12 left-0 flex space-x-2 z-40">
                    {/* 数値のない猫ボタン */}
                    <button 
                      onClick={() => handleAddCount(node.id)} 
                      className="w-12 h-12 control-90s shadow-hard flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      <span className="text-[22px] pixel-glyph">🐈</span>
                    </button>
                    
                    {/* MOHUボタン（沈黙の3秒） */}
                    <button 
                      onClick={() => handleTriggerMOHU(node.id, node.interaction_count || 0)} 
                      disabled={cooldowns.has(node.id)}
                      className={`relative px-8 h-12 shadow-hard font-bold text-[14px] uppercase tracking-[0.3em] transition-all
                        ${cooldowns.has(node.id) 
                          ? 'bevel-3d-inset bg-[#d0d0d0] text-gray-500 translate-x-0.5 translate-y-0.5 shadow-none' 
                          : 'control-90s active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'}`}
                    >
                      {cooldowns.has(node.id) ? '....' : 'Mohu'}

                      <div className="absolute top-0 left-0 w-full h-0 pointer-events-none">
                        {floatingEmojis.filter(e => e.nodeId === node.id).map(e => (
                          <div key={e.id} className="absolute animate-glyph-swipe" style={{ left: `${e.x}%`, animationDelay: `${e.delay}s` }}>
                            <span className="text-[20px] pixel-glyph" style={{ color: e.color }}>{e.glyph}</span>
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
          <span className="text-[12px] font-bold text-[#000080]">＋ picture</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
        <button onClick={() => setViewMode('MY_PAGE')} className={`w-20 h-10 control-90s shadow-hard font-bold text-[10px] ${viewMode === 'MY_PAGE' ? 'bevel-3d-inset' : ''}`}>MY_PAGE</button>
      </footer>
    </div>
  );
}