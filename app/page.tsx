'use client';

import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'room139_fog_local_data_v2'; // データ構造変更のためキーを変更

// データ構造を拡張
type Node = {
  id: string;
  image_url: string; // Base64
  created_at: string;
  interaction_count: number; // ●ボタンの押された回数
};

export default function Room139Fog90s() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // 揺れているノードを管理
  const [shakingIds, setShakingIds] = useState<Set<string>>(new Set());
  const [bubbles, setBubbles] = useState<{ id: number, nodeId: string, x: number, color: string }[]>([]);
  
  // ダブルタップロジックは削除

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { 
        setNodes(JSON.parse(saved)); 
      } catch (e) { 
        console.error("Data load failed", e); 
      }
    }
  }, []);

  const saveToLocal = (newNodes: Node[]) => {
    setNodes(newNodes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newNodes));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;
    
    // Base64変換中はローディングを表示
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const newNode: Node = {
        id: `node-${Date.now()}`,
        image_url: event.target?.result as string,
        created_at: new Date().toISOString(),
        interaction_count: 0, // 初期化
      };
      const updatedNodes = [newNode, ...nodes];
      saveToLocal(updatedNodes);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // --- 外界からの接触: ●ボタン（脈動） ---
  const handleInteractionCountIncrement = (nodeId: string) => {
    // 回数をインクリメント
    const updatedNodes = nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, interaction_count: n.interaction_count + 1 };
      }
      return n;
    });
    saveToLocal(updatedNodes);

    // 揺れを開始（既存の揺れがあればリセットして再開）
    setShakingIds(prev => new Set(prev).add(nodeId));

    // 2秒後に揺れフラグを落とす（1往復自動停止）
    setTimeout(() => {
      setShakingIds(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }, 2000);
  };

  // --- 外界からの接触: viewボタン（泡） ---
  const handleShowBubbles = (nodeId: string, count: number) => {
    // サイバーポップな色（紫、ピンク、水色、黄色）
    const colors = ['#f830f8', '#00e0ff', '#ffe000', '#f8f830', '#ffffff'];
    const newBubbles = [];
    
    // 回数分の泡を生成
    for (let i = 0; i < count; i++) {
      const newBubble = {
        id: Date.now() + Math.random(),
        nodeId: nodeId,
        x: Math.random() * 80 + 10, 
        color: colors[Math.floor(Math.random() * colors.length)],
      };
      newBubbles.push(newBubble);
    }

    // 最大150個まで保持
    setBubbles(prev => [...prev.slice(-149), ...newBubbles]);

    // 2.5秒後に消滅（メモリ対策）
    setTimeout(() => {
      const bubbleIdsToDelete = new Set(newBubbles.map(b => b.id));
      setBubbles(prev => prev.filter(b => !bubbleIdsToDelete.has(b.id)));
    }, 2500);
  };

  const deleteNode = (id: string) => {
    if (confirm("このノードを霧に返しますか？")) {
      const updatedNodes = nodes.filter(n => n.id !== id);
      saveToLocal(updatedNodes);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-none font-sans text-xs flex flex-col">
      <style jsx global>{`
        body {
          /* 背景：ベタ塗りの薄紫 */
          background-color: #b19cd9;
          margin: 0;
          color: black;
        }
        /* ゆっくり脈打つような揺れ（BPM60の1往復） */
        @keyframes rhythmShake {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2.5deg); }
        }
        /* 泡がフワッと消えながら上へ登る (ピクセルアートの泡) */
        @keyframes bubbleUp {
          0% { transform: translateY(10px) scale(0.5); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translateY(-200px) scale(1.8); opacity: 0; }
        }
        /* 1往復で止まるアニメーション */
        .animate-slow-shake { 
          animation: rhythmShake 2s ease-in-out; 
          animation-iteration-count: 1; /* 1往復 */
        }
        .animate-bubble-pixel { 
          animation: bubbleUp 2.5s forwards ease-out; 
        }
        /* OS標準のベベル（立体感） */
        .bevel-3d {
          box-shadow: inset 1px 1px 0 white, inset -1px -1px 0 #808080;
        }
        .bevel-3d-inset {
          box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 white;
        }
        /* 強いピクセルシャドー */
        .shadow-hard {
          box-shadow: 4px 4px 0 #000000;
        }
        /* 鼠色のコントロールパーツ */
        .control-90s {
          @apply bevel-3d bg-[#c0c0c0] active:bevel-3d-inset;
        }
      `}</style>

      {/* ヘッダー：room139.fog (ブルー固定) */}
      <header className="fixed top-0 left-0 right-0 z-50 h-7 bevel-3d-inset bg-[#000080] p-1 shadow-hard pointer-events-none">
        <div className="w-full h-full flex items-center justify-between px-2 pointer-events-auto">
          <div className="flex items-center text-white font-bold space-x-2">
            <div className="w-3 h-3 bg-white/30 border border-white/50" />
            <h1 className="text-[10px] tracking-widest uppercase">room139.fog</h1>
          </div>
          <div className="flex space-x-1">
            <div className="w-4 h-4 control-90s flex items-center justify-center text-[8px] font-bold">_</div>
            <div className="w-4 h-4 control-90s flex items-center justify-center text-[8px] font-bold">✕</div>
          </div>
        </div>
      </header>

      {/* メイン空間 (スクロールエリア) */}
      <main className="relative z-10 flex flex-col items-center pt-10 pb-20 space-y-12">
        {nodes.map((node) => (
          <div 
            key={node.id} 
            className="relative w-full max-w-[100vw] aspect-square flex items-center justify-center"
          >
            {/* 揺れるコンテナ (1回・自動停止) */}
            <div 
              className={`relative w-[90%] md:w-[400px] h-[90%] md:h-[400px] transition-transform duration-500 ${shakingIds.has(node.id) ? 'animate-slow-shake' : ''}`}
            >
              
              {/* 画像フレーム：鼠色ベタ + シャドー */}
              <div 
                className="absolute inset-0 bg-[#c0c0c0] p-1 shadow-hard control-90s rounded-[2px]"
              >
                {/* 画像本体 */}
                <img 
                  src={node.image_url} 
                  className="w-full h-full object-cover opacity-95 transition-opacity duration-700 hover:opacity-100 rounded-[2px]" 
                  alt="fog node"
                  style={{ imageRendering: 'pixelated' }} /* ピクセルアート風のレンダリング */
                />
              </div>

              {/* ボタンエリア (画像の下) */}
              <div className="absolute top-[calc(100%-40px)] left-2 right-2 flex space-x-2 z-40 h-8 pointer-events-auto">
                {/* ●ボタン：鼠色ベタ + シャドー、タップで1往復揺れる */}
                <button
                  onClick={() => handleInteractionCountIncrement(node.id)}
                  className="w-8 h-8 control-90s rounded-[2px] flex items-center justify-center shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  <div className="w-4 h-4 rounded-full bg-black/60" /> {/* ●マーク */}
                </button>
                
                {/* viewボタン：鼠色ベタ + シャドー、タップで泡が出る */}
                <button
                  onClick={() => handleShowBubbles(node.id, node.interaction_count)}
                  className="w-16 h-8 control-90s rounded-[2px] shadow-hard flex items-center justify-center text-black font-bold text-[8px] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  view
                </button>
              </div>

              {/* 削除ボタン：フレームの右上に移動 */}
              <button 
                onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                className="absolute top-2 right-2 z-50 w-5 h-5 bevel-3d-inset bg-[#c0c0c0] flex items-center justify-center text-black font-bold text-xs active:bevel-3d"
              >✕</button>

              {/* 泡レイヤー (ピクセルアートの泡) */}
              {/* 位置をフレーム上部に調整 */}
              <div className="absolute top-2 left-0 right-0 h-0 pointer-events-none z-30">
                {bubbles.filter(b => b.nodeId === node.id).map(b => (
                  <div
                    key={b.id}
                    className="absolute animate-bubble-pixel w-6 h-6 rounded-full blur-[2px] mix-blend-screen"
                    style={{ left: `${b.x}%`, backgroundColor: b.color }}
                  />
                ))}
              </div>

            </div>

          </div>
        ))}
      </main>

      {/* フッター：鼠色固定 */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-[#c0c0c0] bevel-3d-inset flex flex-col items-center justify-center shadow-hard pointer-events-none p-2">
        <div className="flex-grow flex items-center justify-center">
          {/* 投稿ボタン：鼠色ベタ塗り + 強いシャドー */}
          <label className="group relative w-32 h-10 flex items-center justify-center cursor-pointer control-90s shadow-hard pointer-events-auto active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
            <span className="text-2xl font-bold text-[#000080]">＋</span>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </label>
        </div>
        <p className="w-full text-center text-[8px] text-black/40 tracking-[1em] uppercase font-bold pointer-events-auto">Local File System</p>
      </footer>

      {/* ローディングオーバーレイ */}
      {isUploading && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-[#c0c0c0] p-4 shadow-hard control-90s">
            <p className="text-[10px] tracking-[0.2em] text-[#000080] animate-pulse font-bold">
              FILE INHALING...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}