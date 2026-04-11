'use client';

import React, { useState, useEffect } from 'react';

// ... (STORAGE_KEY, Node型, ViewMode型は維持)

// --- 猫嫌いのためのドット絵資産 (90s ASCII Art / Glyph 風) ---

// ●ボタン用の「猫の顔（ビットマップ風）」
// 小さくてパキッとした、昔のフォントに含まれてそうな猫。
const PixelCatFace = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
    <rect x="3" y="5" width="2" height="2" fill="black" fillOpacity="0.7"/> {/* 耳 */}
    <rect x="15" y="5" width="2" height="2" fill="black" fillOpacity="0.7"/> {/* 耳 */}
    <rect x="5" y="7" width="10" height="8" fill="black" fillOpacity="0.7"/> {/* 顔 */}
    <rect x="7" y="9" width="2" height="2" fill="#b19cd9"/> {/* 目 */}
    <rect x="11" y="9" width="2" height="2" fill="#b19cd9"/> {/* 目 */}
    <rect x="9" y="11" width="2" height="2" fill="#ffb6c1"/> {/* 鼻 */}
  </svg>
);

// モフられた時に浮かぶ「ドット猫（泡の代わり）」
// 少し大きく、色が薄紫の背景に溶けるような、霧の中の猫。
const PixelCatFloat = ({ color }: { color: string }) => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
    <rect x="6" y="8" width="3" height="3" fill={color}/> {/* 耳 */}
    <rect x="21" y="8" width="3" height="3" fill={color}/> {/* 耳 */}
    <rect x="9" y="11" width="12" height="10" fill={color}/> {/* 顔 */}
    <rect x="11" y="14" width="2" height="2" fill="black" fillOpacity="0.3"/> {/* 目 */}
    <rect x="17" y="14" width="2" height="2" fill="black" fillOpacity="0.3"/> {/* 目 */}
    <rect x="14" y="17" width="2" height="2" fill="#ffb6c1" fillOpacity="0.8"/> {/* 鼻 */}
    <rect x="11" y="19" width="8" height="1" fill="black" fillOpacity="0.3"/> {/* 口 */}
  </svg>
);

export default function Room139Fog90s() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [shakingIds, setShakingIds] = useState<Set<string>>(new Set());
  // 泡の代わりに猫を管理（データ構造は同じでOK）
  const [floatingCats, setFloatingCats] = useState<{ id: number, nodeId: string, x: number, color: string }[]>([]);
  
  // ... (useEffect, saveToLocal, handleFileChange, deleteNode, ユーザー情報は維持)

  // --- ●ボタン（猫の気配：揺れ） ---
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

  // --- MOHUボタン（霧の中の猫：浮かび上がる） ---
  const handleShowFloatingCats = (nodeId: string, count: number) => {
    // 霧っぽい、淡い色に変更（薄紫、水色、白）
    const colors = ['#f830f833', '#00e0ff33', '#ffffff44'];
    
    // 1回のモフで出る猫の数を制限しつつ生成
    const newCats = Array.from({ length: Math.min(count + 1, 15) }).map(() => ({
      id: Math.random(),
      nodeId: nodeId,
      x: Math.random() * 60 + 20, // ボタン付近
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setFloatingCats(prev => [...prev.slice(-100), ...newCats]);

    setTimeout(() => {
      const ids = new Set(newCats.map(c => c.id));
      setFloatingCats(prev => prev.filter(c => !ids.has(c.id)));
    }, 2500);
  };

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden flex flex-col bg-[#b19cd9]">
      {/* ... (link, * スタイル、タイトルバー維持) ... */}
      
      <style jsx global>{`
        /* ... (既存のスタイル維持) ... */
        @keyframes rhythmShake {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2deg); }
        }
        /* 猫：ボタンの位置から霧の中を浮かんでいく */
        @keyframes catFloatFromButton {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(-380px) scale(2.2); opacity: 0; }
        }
        .animate-slow-shake { animation: rhythmShake 2s ease-in-out 1; }
        .animate-cat-float { animation: catFloatFromButton 2.5s forwards ease-out; }
        
        .bevel-3d { box-shadow: inset 1px 1px 0 white, inset -1px -1px 0 #808080; }
        .bevel-3d-inset { box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 white; }
        .shadow-hard { box-shadow: 4px 4px 0 #000000; }
        .control-90s { @apply bevel-3d bg-[#c0c0c0] active:bevel-3d-inset; }
        .win-titlebar { @apply bg-[#000080] text-white font-bold flex items-center justify-between px-2; }
      `}</style>

      {/* ヘッダー維持 */}

      {/* メインエリア */}
      <main className="flex-1 overflow-y-auto p-4 space-y-20 pb-40">
        {viewMode === 'MY_PAGE' ? (
          /* --- マイページ（維持） --- */
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
            {/* ... (過去の画像並び維持) ... */}
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
                  
                  {/* ボタンエリア */}
                  <div className="absolute -bottom-12 left-0 flex space-x-2 z-40">
                    {/* ●ボタン（猫の気配） */}
                    <button onClick={() => handleInteraction(node.id)} className="w-12 h-12 control-90s shadow-hard flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                      <PixelCatFace /> {/* ここを猫の顔に変更 */}
                    </button>
                    
                    {/* MOHUボタン（霧の中の猫：浮かび上がる） */}
                    <button 
                      onClick={() => handleShowFloatingCats(node.id, node.interaction_count)} 
                      className="relative px-6 h-12 control-90s shadow-hard font-bold text-[14px] tracking-widest active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      MOHU {/* テキストを変更 */}
                      
                      {/* 猫レイヤー：ボタンの内部から溢れ出す */}
                      <div className="absolute top-0 left-0 w-full h-0 pointer-events-none">
                        {floatingCats.filter(c => c.nodeId === node.id).map(c => (
                          <div 
                            key={c.id} 
                            className="absolute animate-cat-float w-6 h-6 rounded-full mix-blend-screen" 
                            style={{ 
                              left: `${c.x}%`, 
                              animationDelay: `${Math.random() * 0.2}s` 
                            }} 
                          >
                            <PixelCatFloat color={c.color} /> {/* ここをドット猫に変更 */}
                          </div>
                        ))}
                      </div>
                    </button>
                  </div>
                  {/* ... (deleteNodeボタン維持) ... */}
                </div>
              </div>
            ))}
            {/* ... (NO FOG DATA維持) ... */}
          </div>
        )}
      </main>

      {/* ... (フッター、ローディング維持) ... */}
    </div>
  );
}