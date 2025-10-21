'use client';
import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'info', onClose }: { message: string; type?: 'info'|'success'|'warning'|'error'; onClose?: ()=>void }){
  const [show, setShow] = useState(true);
  useEffect(()=>{
    const t = setTimeout(()=>{ setShow(false); if (onClose) onClose(); }, 4000);
    return ()=>clearTimeout(t);
  },[onClose]);
  if (!show) return null;
  const bg = type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-yellow-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <div className={`${bg} text-white p-3 rounded fixed bottom-6 right-6 shadow-lg`}>{message}</div>
  );
}
