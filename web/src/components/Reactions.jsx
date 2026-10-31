import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../api/client';
import { toast } from '../store/uiSlice';

const SCORE = { like: 1, dislike: -1 };

/* Like / dislike control. `kind` is "posts" or "comments". */
export default function Reactions({ kind, id, rating, myReaction, locked = false }) {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [score, setScore] = useState(rating);
  const [mine, setMine] = useState(myReaction);
  const [busy, setBusy] = useState(false);

  // a fresh server value (after reload or pagination) replaces the local one
  useEffect(() => { setScore(rating); setMine(myReaction); }, [rating, myReaction]);

  const react = async (type) => {
    if (!user || locked || busy) return;
    setBusy(true);
    try {
      const previous = mine ? SCORE[mine] : 0;
      if (mine === type) {
        await api.unreact(kind, id);
        setScore(score - previous);
        setMine(null);
      } else {
        await api.react(kind, id, type);
        setScore(score - previous + SCORE[type]);
        setMine(type);
      }
    } catch (e) {
      dispatch(toast(e.message));
    } finally { setBusy(false); }
  };

  let hint;
  if (!user) hint = 'Log in to vote';
  else if (locked) hint = 'Voting is disabled: this item is locked';
  return (
    <div className="votes" title={hint}>
      <button type="button" disabled={!user || locked} className={mine === 'like' ? 'is-on' : ''} aria-pressed={mine === 'like'} onClick={() => react('like')} aria-label="Like">▲</button>
      <b aria-label="Rating">{score}</b>
      <button type="button" disabled={!user || locked} className={mine === 'dislike' ? 'is-on' : ''} aria-pressed={mine === 'dislike'} onClick={() => react('dislike')} aria-label="Dislike">▼</button>
    </div>
  );
}
