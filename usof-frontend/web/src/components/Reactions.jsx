import { useState } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../api/client';

export default function Reactions({ kind, id, likes }) {
  const user = useSelector((s) => s.auth.user);
  const [score, setScore] = useState(likes);
  const [mine, setMine] = useState(null);

  const react = async (type) => {
    if (!user) return;
    try {
      if (mine === type) {
        await api.unreact(kind, id);
        setScore(score + (type === 'like' ? -1 : 1));
        setMine(null);
      } else {
        await api.react(kind, id, type);
        const undo = mine ? (mine === 'like' ? -1 : 1) : 0;
        setScore(score + undo + (type === 'like' ? 1 : -1));
        setMine(type);
      }
    } catch (e) { /* keep previous score if the request fails */ }
  };

  return (
    <div className="votes">
      <button type="button" disabled={!user} className={mine === 'like' ? 'is-on' : ''} onClick={() => react('like')} aria-label="Like">▲</button>
      <b>{score}</b>
      <button type="button" disabled={!user} className={mine === 'dislike' ? 'is-on' : ''} onClick={() => react('dislike')} aria-label="Dislike">▼</button>
    </div>
  );
}
