import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from '../store/uiSlice';

/* Share buttons. Instagram has no web share link, so the native share sheet (phones) and "Copy link" cover it. */
export default function ShareMenu({ url, title }) {
  const dispatch = useDispatch();
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const targets = [
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ['X', `https://twitter.com/intent/tweet?url=${u}&text=${t}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ['Telegram', `https://t.me/share/url?url=${u}&text=${t}`],
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) { dispatch(toast('Could not copy the link')); }
  };

  const nativeShare = async () => {
    try { await navigator.share({ title, url }); } catch (e) { /* the user closed the sheet */ }
  };

  return (
    <div className="share__group" role="group" aria-label="Share this question">
      {typeof navigator.share === 'function' && (
        <button type="button" className="btn btn--ghost" onClick={nativeShare}>Share…</button>
      )}
      <button type="button" className="btn btn--ghost" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
      {targets.map(([name, href]) => (
        <a key={name} className="btn btn--ghost" target="_blank" rel="noreferrer" href={href}>{name}</a>
      ))}
    </div>
  );
}
