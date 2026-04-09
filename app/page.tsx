'use client';

import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'room139_fog_local_data';

export default function Room139FogLocal() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<{ id: number, x: number, color: string }[]>([]);

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

  // --- 外界からの接触: 長押し（揺れ） ---
  const startPress = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setShakingId(id);
    }, 1000);
  };

  const endPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    setShakingId(null);
  };

  // --- 外界からの接触: タップ（泡） ---
  const spawnBubble = (e: React.MouseEvent | React.TouchEvent) => {
    const colors = ['#FFD1DC', '#BFFCC6', '#D5AAFF', '#FFFFD1', '#AFE4FF'];
    const newBubble = {
      id: Date.now(),
      x: Math.random() * 80 + 10, // 画像の横幅10%~90%の間から発生
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    setBubbles(prev => [...prev.slice(-149), newBubble]); // 最大150個

    // 2秒後に消去（メモリ対策）
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== newBubble.id));
    }, 2000);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-none">
      <style jsx global>{`
        body {
          background: linear-gradient(125deg, #e0c3fc 0%, #8ec5fc 100%);
          background-attachment: fixed;
          margin: 0;
        }
        @keyframes shake {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes bubbleUp {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(-150px) scale(1.5); opacity: 0; }
        }
        .animate-shake { animation: shake 0.2s infinite ease-in-out; }
        .animate-bubble { animation: bubbleUp 2s forwards ease-out; }
      `}</style>

      {/* ヘッダー */}
      <header className="fixed top-6 left-6 z-50 mix-blend-difference">
        <h1 className="text-white/40 text-[10px] tracking-[0.5em] font-light uppercase">room139.fog</h1>
      </header>

      {/* メイン：画像間隔を最小化、画面幅いっぱい */}
      <main className="relative z-10 flex flex-col items-center">
        {nodes.map((node) => (
          <div 
            key={node.id} 
            className="relative w-full max-w-[100vw] aspect-square flex items-center justify-center overflow-hidden"
            onMouseDown={() => startPress(node.id)}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchStart={() => startPress(node.id)}
            onTouchEnd={endPress}
            onClick={spawnBubble}
          >
            {/* 画像本体：400px制限を解除し、画面幅or最大800px程度に */}
            <div className={`
              relative w-[95%] h-[95%] rounded-[12px] overflow-hidden shadow-2xl transition-all duration-700
              ${shakingId === node.id ? 'animate-shake' : ''}
            `}>
              <img 
                src={node.image_url} 
                className="w-full h-full object-cover opacity-95" 
                alt="fog node"
              />
              
              {/* 泡のレンダリングエリア（画像の上部に重なる） */}
              <div className="absolute inset-0 pointer-events-none overflow-visible">
                {bubbles.map(b => (
                  <div
                    key={b.id}
                    className="absolute top-0 animate-bubble w-4 h-4 rounded-full blur-[2px]"
                    style={{ left: `${b.x}%`, backgroundColor: b.color }}
                  />
                ))}
              </div>
            </div>

            {/* 削除ボタン */}
            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm("消去？")) saveToLocal(nodes.filter(n => n.id !== node.id)); }}
              className="absolute top-4 right-4 z-20 text-white/20 hover:text-white/80 p-4"
            >✕</button>
          </div>
        ))}
      </main>

      {/* 投稿ボタン */}
      <nav className="fixed bottom-10 left-0 right-0 flex flex-col items-center z-50">
        <label className="w-16 h-16 flex items-center justify-center cursor-pointer bg-white/90 backdrop-blur rounded-full shadow-2xl border border-white/20 active:scale-90 transition-transform">
          <span className="text-2xl font-light text-blue-300">+</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
        <p className="mt-4 text-[8px] text-white/30 tracking-[1em] uppercase">local</p>
      </nav>

      {isUploading && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-3xl z-[100] flex items-center justify-center text-[10px] tracking-[1em] text-blue-400 animate-pulse">
          INHALING...
        </div>
      )}
    </div>
  );
}