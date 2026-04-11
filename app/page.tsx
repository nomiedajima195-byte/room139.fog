'use client';

import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'room139_fog_glyph_mohu';

type Node = {
  id: string;
  image_url: string;
  created_at: string;
  interaction_count: number;
};

type ViewMode = {
  FEED: 'FEED';
  MY_PAGE: 'MY_PAGE';
};

const ViewModes: ViewMode = {
  FEED: 'FEED',
  MY_PAGE: 'MY_PAGE',
};

export default function Room139Fog90s() {
  // --- 状態管理 ---
  const [viewMode, setViewMode] = useState<keyof ViewMode>(ViewModes.FEED);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [shakingIds, setShakingIds] = useState<Set<string>>(new Set());
  // 絵文字を浮かせるための状態
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number, nodeId: string, x: number, delay: number, glyph: string, color: string }[]>([]);
  
  const [user] = useState({
    name: 'kurata.fog',
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  });

  // --- ライフサイクル・保存 ---
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

  // --- アクション ---
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

  const handleMOHU = (nodeId: string, count: number) => {
    // 接触を表現する絵文字リスト（猫に関連するもの）
    const emojis = ['🐈', '🐾', '🐈‍⬛'];
    
    // パーティクルの色（モノクロUIに馴染ませる）
    const colors = ['#ffffff', '#000000bb', '#808080'];

    const newEmojis = Array.from({ length: Math.min(count + 4, 20) }).map((_, i) => ({
      id: Math.random(),
      nodeId: nodeId,
      x: (i * 12) % 100, // 横に並んで通り過ぎるように
      delay: i * 0.08,  // 時間差でスッとなでる
      glyph: emojis[i % emojis.length], // 絵文字をローテーション
      color: colors[i % colors.length], // 色をローテーション
    }));

    setFloatingEmojis(prev => [...prev.slice(-150), ...newEmojis]);
    
    // 画像を少し揺らす（存在確認）
    setShakingIds(prev => new Set(prev).add(nodeId));
    setTimeout(() => setShakingIds(prev => { const n = new Set(prev); n.delete(nodeId); return n; }), 2000);

    setTimeout(() => {
      const ids = new Set(newEmojis.map(e => e.id));
      setFloatingEmojis(prev => prev.filter(e => !ids.has(e.id)));
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

        /* 現代のカラフルな絵文字を90年代のモノクロビットマップ風に強制変換する魔法のCSS */
        .pixel-glyph {
          filter: grayscale(100%) brightness(0.2) contrast(1.5);
          image-rendering: pixelated; /* スマホブラウザでの補完をオフ */
          transform-origin: center;
        }

        @keyframes rhythmShake {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1.5deg); }
        }
        
        /* 絵文字が脚をなでていく軌道（左から右へ、少しうねりながら昇る） */
        @keyframes glyphSwipe {
          0% { transform: translate(-40px, 0) scale(1) rotate(-5deg); opacity: 0; }
          20% { opacity: 1; }
          50% { transform: translate(20px, -140px) scale(1.6) rotate(5deg); }
          100% { transform: translate(70px, -320px) scale(0.6) rotate(-10deg); opacity: 0; }
        }

        .animate-slow-shake { animation: rhythmShake 2s ease-in-out 1; }
        .animate-glyph-swipe { animation: glyphSwipe 1.8s forwards ease-out; }
        
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
          <h1 className="text-[12px] tracking-tighter uppercase cursor-pointer" onClick={() => setViewMode(ViewModes.FEED)}>
            room139.fog {viewMode === ViewModes.MY_PAGE && ' - PROFILE'}
          </h1>
        </div>
        <div className="flex space-x-1">
          <div className="w-4 h-4 control-90s flex items-center justify-center text-[10px]">_</div>
          <div className="w-4 h-4 control-90s flex items-center justify-center text-[10px]">✕</div>
        </div>
      </header>

      {/* メインエリア */}
      <main className="flex-1 overflow-y-auto p-4 space-y-20 pb-40">
        
        {viewMode === ViewModes.MY_PAGE ? (
          /* --- マイページ --- */
          <div className="w-full max-w-[400px] mx-auto space-y-6">
            <div className="control-90s p-4 shadow-hard flex flex-col items-center">
              <div className="w-20 h-20 bevel-3d-inset p-1 bg-white mb-4">
                <img src={user.icon} alt="icon" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              </div>
              <h2 className="text-[18px] text-[#000080] font-bold">{user.name}</h2>
              <button className="mt-4 px-6 h-10 control-90s shadow-hard text-[14px] font-bold active:translate-x-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-widest">
                Check
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
                  <div className="absolute inset-0 bg-[#c0c0c0] p-1 shadow-hard control-90s overflow-hidden rounded-[2px]">
                    <img src={node.image_url} className="w-full h-full object-cover rounded-[2px]" alt="" style={{ imageRendering: 'pixelated' }} />
                  </div>
                  
                  {/* ボタンエリア */}
                  <div className="absolute -bottom-12 left-0 flex space-x-2 z-40">
                    <button onClick={() => handleMOHU(node.id, node.interaction_count || 0)} className="w-12 h-12 control-90s shadow-hard flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                      {/* 猫嫌いによる無関心な猫絵文字：モノクロ変換 */}
                      <span className="text-[22px] pixel-glyph">🐈‍⬛</span>
                    </button>
                    
                    <button 
                      onClick={() => handleMOHU(node.id, node.interaction_count || 0)} 
                      className="relative px-6 h-12 control-90s shadow-hard font-bold text-[14px] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-widest"
                    >
                      Mohu
                      {/* すり寄り体験：ボタンの内部から絵文字が通り過ぎる */}
                      <div className="absolute top-0 left-0 w-full h-0 pointer-events-none z-30">
                        {floatingEmojis.filter(e => e.nodeId === node.id).map(e => (
                          <div 
                            key={e.id} 
                            className="absolute animate-glyph-swipe flex items-center justify-center" 
                            style={{ 
                              left: `${e.x}%`, 
                              animationDelay: `${e.delay}s`,
                            }} 
                          >
                            {/* 浮かび上がる絵文字：モノクロ変換 */}
                            <span className="text-[20px] pixel-glyph blur-[0.5px]" style={{ color: e.color }}>
                              {e.glyph}
                            </span>
                          </div>
                        ))}
                      </div>
                    </button>
                  </div>
                  <button onClick={() => deleteNode(node.id)} className="absolute top-2 right-2 w-6 h-6 control-90s flex items-center justify-center text-[12px] font-bold">✕</button>
                </div>
              </div>
            ))}
            {nodes.length === 0 && <p className="text-[12px] text-black/50 tracking-widest mt-20 uppercase font-bold">No Fog Data</p>}
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="shrink-0 z-50 h-28 bg-[#c0c0c0] bevel-3d-inset shadow-[0_-4px_0_#000000] flex items-center justify-around p-2">
        <button onClick={() => setViewMode(ViewModes.FEED)} className={`w-16 h-12 control-90s shadow-hard font-bold text-[10px] ${viewMode === ViewModes.FEED ? 'bevel-3d-inset bg-[#e0e0e0]' : ''}`}>FEED</button>
        <label className="w-32 h-12 control-90s shadow-hard flex items-center justify-center cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
          <span className="text-[14px] font-bold text-[#000080] tracking-tighter">＋ picture</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
        <button onClick={() => setViewMode(ViewModes.MY_PAGE)} className={`w-16 h-12 control-90s shadow-hard font-bold text-[10px] ${viewMode === ViewModes.MY_PAGE ? 'bevel-3d-inset bg-[#e0e0e0]' : ''}`}>MY_PAGE</button>
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