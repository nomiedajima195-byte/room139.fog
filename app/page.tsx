'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Config ---
// （※すでに設定済みのURLとキーをそのままお使いください）
const supabaseUrl = 'https://pfxwhcgdbavycddapqmz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeHdoY2dkYmF2eWNkZGFwcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjQ0NzUsImV4cCI6MjA4Mjc0MDQ3NX0.YNQlbyocg2olS6-1WxTnbr5N2z52XcVIpI1XR-XrDtM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Node = {
  id: string;
  image_url: string;
  user_id: string;
  user_name: string;
  created_at: string;
  interaction_count: number;
};

export default function Room139Fog() {
  const [viewMode, setViewMode] = useState<'FEED' | 'MY_PAGE'>('FEED');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  // アニメーション用State
  const [shakingIds, setShakingIds] = useState<Set<string>>(new Set());
  const [swingingButtons, setSwingingButtons] = useState<Set<string>>(new Set());
  const [floatingTracks, setFloatingTracks] = useState<{ id: number, nodeId: string, x: number, delay: number, color: string }[]>([]);
  const [cooldowns, setCooldowns] = useState<Set<string>>(new Set());

  // --- [A] アカウント初期化 (Local) ---
  useEffect(() => {
    const savedId = localStorage.getItem('rubbish_user_id');
    const savedName = localStorage.getItem('rubbish_user_name');
    if (savedId) {
      setMyId(savedId);
      setMyName(savedName || 'anonymous');
    }
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `user-${Date.now()}`;
    localStorage.setItem('rubbish_user_id', newId);
    localStorage.setItem('rubbish_user_name', myName);
    setMyId(newId);
  };

  // --- [B] データ取得 (168時間ルール適用) ---
  const fetchData = useCallback(async () => {
    const sevenDaysAgo = new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('rubbish_nodes')
      .select('*')
      .gt('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false });

    if (data) setNodes(data);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- [C] アクション: 🐱ボタン (他人のNodeを揺らす) ---
  const handleAddTrack = async (node: Node) => {
    // 【ガード】自分の投稿には足跡をつけられない
    if (node.user_id === myId) return;

    setShakingIds(prev => new Set(prev).add(node.id));
    setSwingingButtons(prev => new Set(prev).add(node.id));
    
    await supabase.rpc('increment_interaction', { row_id: node.id });

    setTimeout(() => {
      setShakingIds(prev => { const n = new Set(prev); n.delete(node.id); return n; });
      setSwingingButtons(prev => { const n = new Set(prev); n.delete(node.id); return n; });
      fetchData();
    }, 300);
  };

  // --- [D] アクション: 🐾ボタン (自分のNodeを解放) ---
  const handleTriggerTracks = async (nodeId: string, count: number) => {
    if (cooldowns.has(nodeId) || count === 0) return;
    setCooldowns(prev => new Set(prev).add(nodeId));

    const releaseCount = Math.min(count, 50);
    const colors = ['#ffffffcc', '#c0c0c0aa', '#80808088'];
    const newTracks = Array.from({ length: releaseCount }).map((_, i) => ({
      id: Math.random(), nodeId, x: Math.random() * 70 + 15, delay: i * 0.1, color: colors[i % colors.length],
    }));

    setFloatingTracks(prev => [...prev.slice(-300), ...newTracks]);
    await supabase.rpc('reset_interaction', { row_id: nodeId });

    setTimeout(() => {
      setCooldowns(prev => { const n = new Set(prev); n.delete(nodeId); return n; });
      fetchData();
    }, 3500);

    setTimeout(() => {
      const ids = new Set(newTracks.map(t => t.id));
      setFloatingTracks(prev => prev.filter(t => !ids.has(t.id)));
    }, 3500);
  };

  // --- [E] 写真アップロード ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !myId || isUploading) return;
    setIsUploading(true);

    const fileName = `${myId}/${Date.now()}-${file.name}`;
    
    // Storageへアップロード
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload Error:', uploadError.message);
      alert('アップロードに失敗しました。RLSの設定を確認してください。');
      setIsUploading(false);
      return;
    }

    if (uploadData) {
      // URL取得
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      // DBへ保存
      const { error: dbError } = await supabase
        .from('rubbish_nodes')
        .insert([{
          image_url: publicUrl,
          user_id: myId,
          user_name: myName,
        }]);

      if (dbError) {
        console.error('DB Insert Error:', dbError.message);
        alert('データベースへの保存に失敗しました。');
      } else {
        fetchData(); // 成功時のみ再取得
      }
    }
    setIsUploading(false);
  };

  // ログイン画面
  if (!myId) {
    return (
      <div className="h-[100dvh] bg-[#c0c0c0] flex items-center justify-center font-['DotGothic16'] p-4">
        <div className="w-full max-w-72 bg-[#c0c0c0] p-1 border-2 border-white shadow-hard bevel-3d">
          <div className="bg-[#000080] text-white px-2 py-1 text-[12px] font-bold">room139.fog - Login</div>
          <form onSubmit={handleRegister} className="p-4 space-y-4">
            <p className="text-[10px] leading-relaxed">気配を登録してください。</p>
            <input required maxLength={12} value={myName} onChange={e => setMyName(e.target.value)} placeholder="NAME..." className="w-full bg-white border-2 border-[#808080] p-2 outline-none text-[14px]" />
            <button type="submit" className="w-full bg-[#c0c0c0] border-2 border-white bevel-3d p-2 text-[12px] font-bold active:bevel-3d-inset">ENTER</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden flex flex-col bg-[#b19cd9]">
      <link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet" />
      <style jsx global>{`
        * { font-family: 'DotGothic16', sans-serif !important; -webkit-font-smoothing: none !important; }
        @keyframes catSwing { 0% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } 100% { transform: rotate(0deg); } }
        .animate-cat-swing { animation: catSwing 0.25s ease-in-out; }
        .pixel-glyph-black-silhouette { filter: brightness(0) contrast(1.5); image-rendering: pixelated; }
        .pixel-glyph-gray-archive { filter: grayscale(100%) brightness(0.4) contrast(1.2); image-rendering: pixelated; opacity: 0.8; }
        @keyframes rhythmShake { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.01); } }
        @keyframes tracksPath { 0% { transform: translateY(0) scale(0.4); opacity: 0; } 10% { opacity: 0.8; } 100% { transform: translateY(-380px) scale(2.8); opacity: 0; } }
        .animate-subtle-shake { animation: rhythmShake 0.3s ease-in-out 1; }
        .animate-tracks-path { animation: tracksPath 2.8s forwards ease-out; }
        .bevel-3d { box-shadow: inset 1px 1px 0 white, inset -1px -1px 0 #808080; }
        .bevel-3d-inset { box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 white; }
        .shadow-hard { box-shadow: 4px 4px 0 #000000; }
        .control-90s { @apply bevel-3d bg-[#c0c0c0] active:bevel-3d-inset; }
        .win-titlebar { @apply bg-[#000080] text-white font-bold flex items-center px-2; }
      `}</style>

      <header className="shrink-0 z-50 h-8 win-titlebar m-1 shadow-hard">
        <h1 className="text-[12px] uppercase tracking-tighter">room139.fog</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-48">
        {viewMode === 'MY_PAGE' ? (
          <div className="w-full max-w-[500px] mx-auto space-y-8 pt-4">
             <div className="control-90s p-4 shadow-hard flex flex-col items-center">
                <div className="w-16 h-16 bevel-3d-inset p-1 bg-white mb-2 flex items-center justify-center">
                   <div className="w-10 h-10 bg-[#000080] opacity-20" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                </div>
                <h2 className="text-[14px] text-[#000080] font-bold uppercase tracking-widest">{myName}.fog</h2>
                <p className="text-[8px] opacity-40 mt-1 uppercase">Node Life: 168h</p>
             </div>

             <div className="grid grid-cols-2 gap-x-4 gap-y-16">
                {nodes.filter(n => n.user_id === myId).map(n => (
                  <div key={n.id} className="relative flex flex-col items-center mb-4">
                    <div className="w-full aspect-square control-90s p-1 shadow-hard">
                      <img src={n.image_url} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                    </div>
                    <div className="mt-4 w-full flex justify-center">
                        <button onClick={() => handleTriggerTracks(n.id, n.interaction_count)} disabled={cooldowns.has(n.id) || n.interaction_count === 0} className={`relative w-12 h-10 shadow-hard flex items-center justify-center transition-all ${cooldowns.has(n.id) || n.interaction_count === 0 ? 'bevel-3d-inset bg-[#d8d8d8] opacity-50 cursor-not-allowed' : 'control-90s active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'}`}>
                            <span className="text-[22px] pixel-glyph-gray-archive">🐾</span>
                            {n.interaction_count > 0 && !cooldowns.has(n.id) && <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#000080] shadow-sm"></div>}
                            <div className="absolute top-0 left-0 w-full h-0 pointer-events-none z-50">
                                {floatingTracks.filter(t => t.nodeId === n.id).map(t => (
                                <div key={t.id} className="absolute animate-tracks-path flex items-center justify-center" style={{ left: `${t.x}%`, animationDelay: `${t.delay}s` }}>
                                    <span className="text-[22px] pixel-glyph-gray-archive" style={{ color: t.color }}>🐾</span>
                                </div>
                                ))}
                            </div>
                        </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-24 mt-8">
            {nodes.map((node) => (
              <div key={node.id} className="relative w-full flex flex-col items-center">
                <div className={`relative w-full max-w-[320px] aspect-square ${shakingIds.has(node.id) ? 'animate-subtle-shake' : ''}`}>
                  <div className="absolute inset-0 bg-[#c0c0c0] p-1 shadow-hard control-90s">
                    <img src={node.image_url} className="w-full h-full object-cover grayscale opacity-80" style={{ imageRendering: 'pixelated' }} />
                  </div>
                  
                  {/* 【UI変更】自分のノードかどうかで表示を分ける */}
                  <div className="absolute -top-6 left-1 text-[9px] font-bold text-black/40 uppercase tracking-widest">
                    {node.user_id === myId ? '[ MY NODE ]' : node.user_name}
                  </div>
                  
                  <div className="absolute -bottom-12 left-0 z-40">
                    {node.user_id !== myId ? (
                      <button onClick={() => handleAddTrack(node)} className={`w-12 h-12 control-90s shadow-hard flex items-center justify-center transition-transform ${swingingButtons.has(node.id) ? 'animate-cat-swing' : ''}`}>
                        <span className="text-[26px] pixel-glyph-black-silhouette">🐱</span>
                      </button>
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center opacity-20 pointer-events-none">
                        <span className="text-[20px] pixel-glyph-black-silhouette">🐾</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="shrink-0 z-50 h-24 bg-[#c0c0c0] bevel-3d-inset shadow-[0_-4px_0_#000000] flex items-center justify-around p-2">
        <button onClick={() => setViewMode('FEED')} className={`w-20 h-10 control-90s shadow-hard font-bold text-[10px] ${viewMode === 'FEED' ? 'bevel-3d-inset' : ''}`}>FEED</button>
        <label className="w-24 h-10 control-90s shadow-hard flex items-center justify-center cursor-pointer">
          <span className="text-[12px] font-bold text-[#000080] tracking-tighter">＋ upload</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
        <button onClick={() => setViewMode('MY_PAGE')} className={`w-20 h-10 control-90s shadow-hard font-bold text-[10px] ${viewMode === 'MY_PAGE' ? 'bevel-3d-inset' : ''}`}>MY_PAGE</button>
      </footer>
    </div>
  );
}