'use client';

import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'room139_fog_tracks_v1';

type Node = {
  id: string;
  image_url: string;
  created_at: string;
  interaction_count: number;
};

// --- [自作] 90sビットマップ風：ユーザーアイコン（SVG） ---
const PixelUserIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
        <rect x="11" y="7" width="10" height="10" fill="#000080" fillOpacity="0.8"/> {/* 頭 */}
        <rect x="7" y="17" width="18" height="8" fill="#000080" fillOpacity="0.8"/> {/* 体 */}
    </svg>
);

export default function Room139Fog90s() {
  const [viewMode, setViewMode] = useState<'FEED' | 'MY_PAGE'>('FEED');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [shakingIds, setShakingIds] = useState<Set<string>>(new Set());
  // 浮かぶ足跡を管理
  const [floatingTracks, setFloatingTracks] = useState<{ id: number, nodeId: string, x: number, y: number, delay: number, color: string }[]>([]);

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

  // --- [1] 猫を押す（数値は見えないが、痕跡が溜まる） ---
  const handleAddTrackCount = (nodeId: string) => {
    const updatedNodes = nodes.map(n => 
      n.id === nodeId ? { ...n, interaction_count: (n.interaction_count || 0) + 1 } : n
    );
    saveToLocal(updatedNodes);

    // 存在確認として少しだけ画像を揺らす
    setShakingIds(prev => new Set(prev).add(nodeId));
    setTimeout(() => setShakingIds(prev => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    }), 400);
  };

  // --- [2] 足跡ボタン（溜まった痕跡をペタペタと浮かび上がらせる） ---
  const handleShowTracks = (nodeId: string, count: number) => {
    // 溜まっていなくても1つは出す
    const releaseCount = count > 0 ? Math.min(count, 30) : 1;

    // 足跡の色（モノクロのグラデーション）
    const colors = ['#ffffffdd', '#c0c0c0cc', '#808080aa'];

    const newTracks = Array.from({ length: releaseCount }).map((_, i) => ({
      id: Math.random(),
      nodeId: nodeId,
      x: (i * 12) % 80 + 10, // ペタペタと横に並ぶように
      y: 0,
      delay: i * 0.15, // 時間差でペタ、ペタと出す
      color: colors[i % colors.length],
    }));

    setFloatingTracks(prev => [...prev.slice(-200), ...newTracks]);

    // アニメーション終了後に要素を削除
    setTimeout(() => {
      const ids = new Set(newTracks.map(t => t.id));
      setFloatingTracks(prev => prev.filter(t => !ids.has(t.id)));
    }, 2500);

    // 解放したのでカウントをリセット（出し切った痕跡）
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
        
        /* 現代のカラフルな絵文字を90年代のモノクロビットマップ風に強制変換する魔法のCSS */
        .pixel-glyph {
          filter: grayscale(100%) brightness(0.2) contrast(1.5);
          image-rendering: pixelated; /* スマホブラウザでの補完をオフ */
          transform-origin: center;
        }

        @keyframes rhythmShake {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1deg); }
        }
        
        /* 足跡：ボタンの内部から斜め上へペタペタと昇っていく */
        @keyframes tracksFloat {
          0% { transform: translate(-20px, 0) scale(0.6) rotate(-10deg); opacity: 0; }
          20% { opacity: 1; }
          50% { transform: translate(10px, -120px) scale(1.4) rotate(10deg); }
          100% { transform: translate(30px, -350px) scale(0.4) rotate(-20deg); opacity: 0; }
        }

        .animate-slow-shake { animation: rhythmShake 0.4s ease-in-out 1; }
        .animate-tracks-float { animation: tracksFloat 1.8s forwards ease-out; }
        
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
          /* --- マイページ --- */
          <div className="w-full max-w-[400px] mx-auto space-y-6 pt-4">
             <div className="control-90s p-4 shadow-hard flex flex-col items-center">
                <div className="w-20 h-20 bevel-3d-inset p-1 bg-white mb-2">
                   <div className="w-full h-full bg-[#c0c0c0] flex items-center justify-center">
                       <PixelUserIcon /> {/* 自作アイコン */}
                   </div>
                </div>
                <h2 className="text-[16px] text-[#000080] font-bold uppercase tracking-widest">kurata.fog</h2>
             </div>
             <div className="grid grid-cols-2 gap-4">
                {nodes.map(n => (
                  <div key={n.id} className="control-90s p-1 shadow-hard aspect-square">
                    <img src={n.image_url} className="w-full h-full object-covergrayscale grayscale opacity-40" style={{ imageRendering: 'pixelated' }} />
                  </div>
                ))}
             </div>
          </div>
        ) : (
          /* --- フィード --- */
          <div className="flex flex-col items-center space-y-24">
            {nodes.map((node) => (
              <div key={node.id} className="relative w-full flex flex-col items-center">
                <div className={`relative w-full max-w-[320px] aspect-square ${shakingIds.has(node.id) ? 'animate-slow-shake' : ''}`}>
                  <div className="absolute inset-0 bg-[#c0c0c0] p-1 shadow-hard control-90s rounded-[2px]">
                    <img src={node.image_url} className="w-full h-full object-cover rounded-[2px]" alt="" style={{ imageRendering: 'pixelated' }} />
                  </div>
                  
                  {/* ボタンエリア */}
                  <div className="absolute -bottom-12 left-0 flex space-x-2 z-40">
                    {/* [猫ボタン] 痕跡を貯める：モノクロ変換 */}
                    <button 
                      onClick={() => handleAddTrackCount(node.id)} 
                      className="w-12 h-12 control-90s shadow-hard flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    >
                      <span className="text-[24px] pixel-glyph">🐱</span>
                    </button>
                    
                    {/* [足跡ボタン] 解放：モノクロ変換 */}
                    <button 
                      onClick={() => handleShowTracks(node.id, node.interaction_count || 0)} 
                      className="relative w-12 h-12 control-90s shadow-hard flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    >
                      <span className="text-[24px] pixel-glyph">🐾</span>

                      {/* 足跡アニメーション：ボタンの内部からペタペタ浮かび上がる */}
                      <div className="absolute top-0 left-0 w-full h-0 pointer-events-none z-30">
                        {floatingTracks.filter(t => t.nodeId === node.id).map(t => (
                          <div 
                            key={t.id} 
                            className="absolute animate-tracks-float flex items-center justify-center" 
                            style={{ 
                              left: `${t.x}%`, 
                              animationDelay: `${t.delay}s`,
                            }} 
                          >
                            {/* 浮かび上がる足跡：モノクロ変換、少し透過 */}
                            <span className="text-[22px] pixel-glyph blur-[0.5px]" style={{ color: t.color }}>
                              🐾
                            </span>
                          </div>
                        ))}
                      </div>
                    </button>
                  </div>
                  <button onClick={() => saveToLocal(nodes.filter(n => n.id !== node.id))} className="absolute -top-1 -right-1 w-6 h-6 control-90s flex items-center justify-center text-[10px] font-bold active:translate-x-0.5 active:translate-y-0.5active:shadow-none transition-all">✕</button>
                </div>
              </div>
            ))}
            {nodes.length === 0 && <p className="text-[12px] text-black/50 tracking-widest mt-20 uppercase font-bold">No Fog Data</p>}
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