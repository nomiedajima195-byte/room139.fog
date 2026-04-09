'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase設定 ---
const supabaseUrl = 'https://pfxwhcgdbavycddapqmz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeHdoY2dkYmF2eWNkZGFwcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjQ0NzUsImV4cCI6MjA4Mjc0MDQ3NX0.YNQlbyocg2olS6-1WxTnbr5N2z52XcVIpI1XR-XrDtM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Room139Fog() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // データ取得（気体なのでシンプルに全取得）
  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from('mainline')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setNodes(data);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // アップロード処理（400pxスクエアの思想）
  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;
    setIsUploading(true);

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.png`;
    
    try {
      // 1. Storage
      await supabase.storage.from('images').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);

      // 2. Database (mainline)
      await supabase.from('mainline').insert([
        { id: fileName, image_url: publicUrl, is_public: true }
      ]);

      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-white/30">
      {/* パステルグラデーション背景
        ざらついた質感を出すために微細なノイズをオーバーレイ 
      */}
      <style jsx global>{`
        body {
          background: linear-gradient(125deg, #e0c3fc 0%, #8ec5fc 100%);
          background-attachment: fixed;
          margin: 0;
        }
        .fog-bg {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3仿真 %3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
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

      {/* メインコンテンツ：ノードの浮遊空間 */}
      <main className="relative z-10 flex flex-col items-center pt-32 pb-64 space-y-32">
        {nodes.map((node) => (
          <div key={node.id} className="group relative">
            {/* 400px スクエアノード（12pxラウンド） */}
            <div className="w-[400px] h-[400px] bg-white/10 backdrop-blur-xl rounded-[12px] border border-white/20 shadow-2xl overflow-hidden transition-transform duration-1000 ease-out hover:scale-[1.02]">
              <img 
                src={node.image_url} 
                alt="node"
                className="w-full h-full object-cover opacity-90 transition-opacity duration-700 group-hover:opacity-100"
              />
              
              {/* 色彩Fogの痕跡（将来的にここに動的な色を重ねる） */}
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-400/10 to-blue-400/10 pointer-events-none mix-blend-soft-light" />
            </div>

            {/* 削除などの最小限の操作（マウスホバー時のみ薄く表示） */}
            <button 
              onClick={async () => {
                if(confirm("消去しますか？")) {
                  await supabase.from('mainline').delete().eq('id', node.id);
                  fetchData();
                }
              }}
              className="absolute -right-12 top-0 text-white/20 hover:text-white/60 transition-colors text-xs p-2"
            >
              ✕
            </button>
          </div>
        ))}
      </main>

      {/* 投稿ナビゲーション（ホワイトの〇型ボタン） */}
      <nav className="fixed bottom-12 left-0 right-0 flex flex-col items-center z-50">
        <label className="group relative w-16 h-16 flex items-center justify-center cursor-pointer bg-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-110 active:scale-95">
          <span className="text-2xl font-light text-blue-300 transition-transform group-hover:rotate-90">+</span>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={uploadFile} 
          />
        </label>
        <p className="mt-4 text-[9px] text-white/40 tracking-[0.6em] font-light uppercase">
          Rubbish
        </p>
      </nav>

      {/* アーカイブ中のオーバーレイ */}
      {isUploading && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-2xl z-[100] flex items-center justify-center">
          <p className="text-[10px] tracking-[0.5em] text-blue-400/60 animate-pulse uppercase">
            Dissolving into fog...
          </p>
        </div>
      )}
    </div>
  );
}