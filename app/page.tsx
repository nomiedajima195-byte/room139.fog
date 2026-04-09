'use client';

import React, { useState, useEffect } from 'react';

// ローカルストレージのキー（デバイス内に保存されます）
const STORAGE_KEY = 'room139_fog_local_data';

export default function Room139FogLocal() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 初回読み込み
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

  // 保存処理
  const saveToLocal = (newNodes: any[]) => {
    setNodes(newNodes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newNodes));
  };

  // ファイル選択時の処理
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

  const deleteNode = (id: string) => {
    if (confirm("このノードを霧に返しますか？")) {
      const updatedNodes = nodes.filter(n => n.id !== id);
      saveToLocal(updatedNodes);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
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

      <header className="fixed top-8 left-8 z-50">
        <h1 className="text-white/60 text-xs tracking-[0.4em] font-light uppercase">
          room139.fog
        </h1>
      </header>

      <main className="relative z-10 flex flex-col items-center pt-32 pb-64 space-y-32">
        {nodes.map((node) => (
          <div key={node.id} className="group relative">
            <div className="w-[320px] md:w-[400px] aspect-square bg-white/10 backdrop-blur-xl rounded-[12px] border border-white/20 shadow-2xl overflow-hidden transition-transform duration-1000 hover:scale-[1.01]">
              <img 
                src={node.image_url} 
                alt="node"
                className="w-full h-full object-cover opacity-90 transition-opacity duration-700 group-hover:opacity-100"
              />
            </div>
            <button 
              onClick={() => deleteNode(node.id)}
              className="absolute -right-12 top-0 text-white/20 hover:text-white/60 p-2 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </main>

      <nav className="fixed bottom-12 left-0 right-0 flex flex-col items-center z-50">
        <label className="group relative w-16 h-16 flex items-center justify-center cursor-pointer bg-white rounded-full shadow-xl transition-all hover:scale-110">
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
        <div className="fixed inset-0 bg-white/40 backdrop-blur-2xl z-[100] flex items-center justify-center text-[10px] tracking-[0.5em] text-blue-400/60 animate-pulse uppercase">
          Inhaling...
        </div>
      )}
    </div>
  );
}