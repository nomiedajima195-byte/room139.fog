'use client';

import React, { useState, useEffect } from 'react';

// --- ローカルストレージ用のキー ---
const STORAGE_KEY = 'room139_fog_local_data';

export default function Room139FogLocal() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 1. デバイスからデータを読み込む
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setNodes(JSON.parse(saved));
      } catch (e) {
        console.error("データ読み込み失敗", e);
      }
    }
  }, []);

  // 2. データをデバイスに保存する
  const saveToLocal = (newNodes: any[]) => {
    setNodes(newNodes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newNodes));
  };

  // 3. 画像アップロード処理（Base64変換してローカル保存）
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Image = event.target?.result as string;
      
      const newNode = {
        id: `node-${Date.now()}`,
        image_url: base64Image,
        created_at: new Date().toISOString(),
      };

      const updatedNodes = [newNode, ...nodes];
      saveToLocal(updatedNodes);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // 4. ノード消去
  const deleteNode = (id: string) => {
    if (confirm("このノードを霧に返しますか？")) {
      const updatedNodes = nodes.filter(n => n.id !== id);
      saveToLocal(updatedNodes);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-white/30">
      <style jsx global>{`
        body {
          background: linear-gradient(125deg, #e0c3fc 0%, #8ec5fc 100%);
          background-attachment: fixed;
          margin: 0;
        }
        .fog-bg {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.05;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      <div className="fog-bg" />

      {/* ヘッダー */}
      <header className="fixed top-8 left-8 z-50">
        <h1 className="text-white/60 text-xs tracking-[0.4em] font-light uppercase">
          room139.fog
        </h1>
      </header>

      {/* メイン空間 */}
      <main className="relative z-10 flex flex-col items-center pt-32 pb-64 space-y-32">
        {nodes.length === 0 && !isUploading && (
          <p className="text-white/30 text-sm italic font-light animate-pulse">
            The fog is empty.
          </p>
        )}

        {nodes.map((node) => (
          <div key={node.id} className="group relative">
            <div className="w-[400px] h-[400px] bg-white/10 backdrop-blur-xl rounded-[12px] border border-white/20 shadow-2xl overflow-hidden transition-transform duration-1000 ease-out hover:scale-[1.01]">
              <img 
                src={node.image_url} 
                alt="node"
                className="w-full h-full object-cover opacity-90 transition-opacity duration-700 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-400/5 to-blue-400/5 pointer-events-none mix-blend-soft-light" />
            </div>

            <button 
              onClick={() => deleteNode(node.id)}
              className="absolute -right-12 top-0 text-white/20 hover:text-white/60 transition-colors text-xs p-2"
            >
              ✕
            </button>
          </div>
        ))}
      </main>

      {/* 投稿ボタン */}
      <nav className="fixed bottom-12 left-0 right-0 flex flex-col items-center z-50">
        <label className="group relative w-16 h-16 flex items-center justify-center cursor-pointer bg-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-110 active:scale-95">
          <span className="text-2xl font-light text-blue-300 transition-transform group-hover:rotate-90">+</span>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </label>
        <p className="mt-4 text-[9px] text-white/40 tracking-[0.6em] font-light uppercase">
          Local Storage Mode
        </p>
      </nav>

      {isUploading && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-2xl z-[100] flex items-center justify-center">
          <p className="text-[10px] tracking-[0.5em] text-blue-400/60 animate-pulse uppercase">
            Inhaling into local fog...
          </p>
        </div>
      )}
    </div>
  );
}