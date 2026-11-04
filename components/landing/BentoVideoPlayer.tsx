'use client';
import React, { useState, useEffect, useRef } from 'react';
import { UNOOL_VIDEO_HTML_DOC } from '@/components/landing/demo-html';

export function BentoVideoPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(480);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data && e.data.type === 'unool-video-resize' && typeof e.data.height === 'number') {
        if (e.data.height > 200) {
          setHeight(Math.ceil(e.data.height));
        }
      }
    }

    function checkDirect() {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (doc) {
          const wrap = (doc.querySelector('.ua-wrap') || doc.body) as HTMLElement;
          const h = wrap ? (wrap.offsetHeight || wrap.scrollHeight) : 0;
          if (h > 200) {
            setHeight(Math.ceil(h));
          }
        }
      } catch (err) {}
    }

    window.addEventListener('message', handleMessage);
    const interval = setInterval(checkDirect, 400);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        lineHeight: 0,
      }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={UNOOL_VIDEO_HTML_DOC}
        src="/unool-video-2-flight-plan.html"
        title="Flight plan & publish interactive walkthrough"
        style={{
          width: '100%',
          height: `${height}px`,
          border: 'none',
          display: 'block',
          background: 'transparent',
          overflow: 'hidden',
        }}
        loading="eager"
        scrolling="no"
        onLoad={() => {
          try {
            const doc = iframeRef.current?.contentDocument;
            if (doc) {
              const wrap = (doc.querySelector('.ua-wrap') || doc.body) as HTMLElement;
              const h = wrap ? (wrap.offsetHeight || wrap.scrollHeight) : 0;
              if (h > 200) {
                setHeight(Math.ceil(h));
              }
            }
          } catch (err) {}
        }}
      />
    </div>
  );
}
