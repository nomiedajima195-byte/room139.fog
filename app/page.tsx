'use client';

import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'room139_fog_local_data';

export default function Room139Fog90s() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // 揺れているノードを管理
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
      // ダブルタップ：揺れを開始
      setShakingIds(prev => new Set(prev).add(nodeId));
      lastTapTime.current[nodeId] = 0;
    } else {
      // シングルタップ：泡
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
    // 泡の色をサイバーポップに調整（紫、ピンク、水色、黄色）
    const colors = ['#f830f8', '#00e0ff', '#ffe000', '#f8f830', '#f83030'];
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

  // Windows 95 タイトルバーのアイコン
  const WindowsIcon = () => (
    <div className="w-4 h-4 mr-1.5 flex items-center justify-center">
      <div className="w-1 h-1 bg-black" />
      <div className="w-1 h-1 bg-black ml-0.5" />
      <div className="w-1 h-1 bg-black ml-0.5" />
      <div className="w-1 h-1 bg-black ml-0.5" />
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-none font-sans text-xs">
      <style jsx global>{`
        body {
          /* 背景：紫のグリッド背景 (image_4.png の背景をそのまま使用) */
          background-color: #3f00f8;
          background-image: 
            linear-gradient(#f8f830 1px, transparent 1px), 
            linear-gradient(90deg, #f8f830 1px, transparent 1px);
          background-size: 20px 20px; /* グリッドのサイズ */
          margin: 0;
          color: black;
        }
        /* ゆっくり漂うような揺れ */
        @keyframes slowShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(1.5deg); }
          75% { transform: rotate(-1.5deg); }
        }
        /* 泡がフワッと消えながら上へ登る (ピクセルアートの泡) */
        @keyframes bubbleUp {
          0% { transform: translateY(10px) scale(0.5); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translateY(-200px) scale(1.8); opacity: 0; }
        }
        /* 3往復で止まるアニメーション */
        .animate-slow-shake-3 { 
          animation: slowShake 2s ease-in-out; 
          animation-iteration-count: 3; 
        }
        .animate-bubble-pixel { 
          animation: bubbleUp 2.5s forwards ease-out; 
        }
        /* Windows 95 スタイルの3Dベベル効果 */
        .bevel-3d {
          box-shadow: inset 1px 1px 0 white, inset -1px -1px 0 #808080;
        }
        /* 逆のベベル効果（ボタンが押された時など） */
        .bevel-3d-inset {
          box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 white;
        }
        /* image_4.png スタイルのピクセル化された強いドロップシャドウ */
        .shadow-pixel-90s {
          box-shadow: 6px 6px 0 #000000; /* image_4.png のように、右下に黒いドットで構成されるシャドー */
        }
        /* カクカクの四角いコントロール (image_4.png スタイル) */
        .control-90s {
          @apply bevel-3d bg-[#c0c0c0] active:bevel-3d-inset;
        }
      `}</style>

      {/* ヘッダー：ドットの room139.fog を Windows 95 タイトルバーに */}
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="flex items-center justify-between h-7 bg-[#000080] bevel-3d-inset px-2 pointer-events-auto shadow-pixel-90s">
          <div className="flex items-center text-white font-bold">
            <WindowsIcon />
            {/* ドットの room139.fog (Microsoft Sans Serif の小さなドットフォントを模倣) */}
            <h1 style={{ fontFamily: 'MS PGothic, Microsoft Sans Serif, Arial' }} className="text-[10px] tracking-tight">room139.fog</h1>
          </div>
          <div className="flex space-x-0.5">
            <button className="w-5 h-5 bevel-3d-inset bg-[#c0c0c0] flex items-center justify-center active:bevel-3d text-black font-bold text-xs">-</button>
            <button className="w-5 h-5 bevel-3d-inset bg-[#c0c0c0] flex items-center justify-center active:bevel-3d text-black font-bold text-xs">✕</button>
          </div>
        </div>
      </header>

      {/* メイン空間 */}
      <main className="relative z-10 flex flex-col items-center pt-20 pb-64 space-y-16">
        {nodes.map((node) => (
          <div 
            key={node.id} 
            className="relative w-full max-w-[100vw] aspect-square flex items-center justify-center py-2"
          >
            {/* 揺れるコンテナ (3往復・自動停止) */}
            <div 
              className={`relative w-[95%] h-[95%] transition-transform duration-500 ${shakingIds.has(node.id) ? 'animate-slow-shake-3' : ''}`}
              onAnimationEnd={() => stopShaking(node.id)}
            >
              
              {/* 画像レイヤー（レトロなウィンドウ風） */}
              <div 
                className="absolute inset-0 bg-[#c0c0c0] p-1 shadow-pixel-90s overflow-hidden cursor-pointer control-90s rounded-[2px]"
                onClick={() => handleInteraction(node.id)}
              >
                {/* 画像本体 */}
                <img 
                  src={node.image_url} 
                  className="w-full h-full object-cover opacity-95 transition-opacity duration-700 hover:opacity-100 rounded-[2px]" 
                  alt="fog node"
                  style={{ imageRendering: 'pixelated' }} /* ピクセルアート風のレンダリング */
                />
              </div>

              {/* 泡レイヤー (ピクセルアートの泡) */}
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

            {/* 削除ボタン（Windows 95 の小さなウィンドウ閉じるボタン） */}
            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm("消去？")) saveToLocal(nodes.filter(n => n.id !== node.id)); }}
              className="absolute top-2 right-2 z-40 w-5 h-5 bevel-3d-inset bg-[#c0c0c0] flex items-center justify-center text-black font-bold text-xs active:bevel-3d"
            >✕</button>
          </div>
        ))}
      </main>

      {/* 投稿ナビゲーション (image_4.png スタイルの、シャドー付き横長コントロール投稿ボタン) */}
      <nav className="fixed bottom-10 left-0 right-0 flex flex-col items-center z-50 pointer-events-none">
        <label className="group relative w-24 h-8 flex items-center justify-center cursor-pointer control-90s rounded-[2px] shadow-pixel-90s transition-all duration-300 active:bevel-3d-inset pointer-events-auto">
          {/* クラシックな「＋」を真ん中に */}
          <span className="text-2xl font-light text-[#000080] transition-transform group-hover:rotate-90">＋</span>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </label>
        <p style={{ fontFamily: 'MS PGothic, Microsoft Sans Serif, Arial' }} className="mt-4 text-[8px] text-white/40 tracking-[0.6em] font-light uppercase">local 199x</p>
      </nav>

      {/* アーカイブ中のオーバーレイ */}
      {isUploading && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-2xl z-[100] flex items-center justify-center">
          <p style={{ fontFamily: 'MS PGothic, Microsoft Sans Serif, Arial' }} className="text-[10px] tracking-[0.5em] text-[#000080] animate-pulse uppercase">
            Inhaling into local fog...
          </p>
        </div>
      )}
    </div>
  );
}