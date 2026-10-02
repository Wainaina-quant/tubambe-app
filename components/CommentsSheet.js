'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import Icon from './Icons';
import EmojiPicker from './EmojiPicker';
import ReportModal from './ReportModal';

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function CommentRow({ comment, currentUserId, onReply, onDeleted }) {
  const [liked, setLiked] = useState(!!comment._liked);
  const [count, setCount] = useState(comment._likeCount || 0);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const isOwn = currentUserId && currentUserId === comment.user_id;

  async function toggleLike() {
    if (!currentUserId) return;
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, next ? c + 1 : c - 1));
    if (next) await supabase.from('comment_likes').insert({ comment_id: comment.id, user_id: currentUserId });
    else await supabase.from('comment_likes').delete().match({ comment_id: comment.id, user_id: currentUserId });
  }

  async function handleDelete() {
    if (!window.confirm('Delete this comment?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', comment.id);
    if (error) alert(error.message);
    else {
      setDeleted(true);
      onDeleted?.();
    }
  }

  if (deleted) return null;

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link href={`/u/${comment.profiles?.handle}`} className="text-[12px] font-bold text-muted">
            @{comment.profiles?.handle || 'user'}
          </Link>
          <p className="text-[13.5px] leading-snug mt-0.5 break-words">{comment.body}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10.5px] text-muted">{timeAgo(comment.created_at)}</span>
            <button onClick={() => onReply(comment)} className="text-[10.5px] text-muted font-semibold">
              Reply
            </button>
            {isOwn ? (
              <button onClick={handleDelete} className="text-[10.5px] text-coral font-semibold">
                Delete
              </button>
            ) : (
              <button onClick={() => (currentUserId ? setReportOpen(true) : null)} className="text-[10.5px] text-muted font-semibold">
                Report
              </button>
            )}
          </div>
        </div>
        <button onClick={toggleLike} className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
          <Icon name="heart" size={13} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-coral' : 'text-muted'} />
          <span className="text-[9.5px] text-muted">{count || ''}</span>
        </button>
      </div>

      {comment.replies?.length > 0 && (
        <div className="mt-2.5 pl-4 border-l border-white/10 flex flex-col gap-3">
          {comment.replies.map((r) => (
            <CommentRow key={r.id} comment={r} currentUserId={currentUserId} onReply={onReply} onDeleted={onDeleted} />
          ))}
        </div>
      )}

      {reportOpen && (
        <ReportModal targetType="comment" targetId={comment.id} reporterId={currentUserId} onClose={() => setReportOpen(false)} />
      )}
    </div>
  );
}

export default function CommentsSheet({ videoId, currentUserId, onClose, onPosted, onDeleted }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null); // comment being replied to
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      const [{ data: rows, error }, { data: likeRows }] = await Promise.all([
        supabase
          .from('comments')
          .select('id, body, created_at, parent_comment_id, user_id, profiles(handle)')
          .eq('video_id', videoId)
          .order('created_at', { ascending: true }),
        supabase.from('comment_likes').select('comment_id, user_id'),
      ]);
      if (error) console.error(error);

      const likeCounts = {};
      const myLikes = new Set();
      (likeRows || []).forEach((r) => {
        likeCounts[r.comment_id] = (likeCounts[r.comment_id] || 0) + 1;
        if (r.user_id === currentUserId) myLikes.add(r.comment_id);
      });

      const byId = {};
      (rows || []).forEach((c) => {
        byId[c.id] = { ...c, replies: [], _likeCount: likeCounts[c.id] || 0, _liked: myLikes.has(c.id) };
      });
      const top = [];
      (rows || []).forEach((c) => {
        if (c.parent_comment_id && byId[c.parent_comment_id]) byId[c.parent_comment_id].replies.push(byId[c.id]);
        else if (!c.parent_comment_id) top.push(byId[c.id]);
      });
      top.reverse(); // newest top-level comment first; replies stay oldest-first
      setComments(top);
      setLoading(false);
    }
    load();
  }, [videoId, currentUserId]);

  async function handlePost(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setPosting(true);
    setError(null);

    const { data, error } = await supabase
      .from('comments')
      .insert({ video_id: videoId, user_id: currentUserId, body, parent_comment_id: replyTo?.id || null })
      .select('id, body, created_at, parent_comment_id, user_id, profiles(handle)')
      .single();

    setPosting(false);
    if (error) {
      setError(error.message);
      return;
    }

    const newComment = { ...data, replies: [], _likeCount: 0, _liked: false };
    if (replyTo) {
      setComments((cs) => cs.map((c) => (c.id === replyTo.id ? { ...c, replies: [...c.replies, newComment] } : c)));
    } else {
      setComments((cs) => [newComment, ...cs]);
    }
    setText('');
    setReplyTo(null);
    onPosted?.();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-stretch md:justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full md:w-[400px] max-h-[75dvh] md:max-h-none md:h-full bg-surface rounded-t-2xl md:rounded-none flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="font-display font-bold text-sm">Comments</h3>
          <button onClick={onClose} aria-label="Close comments" className="text-muted">
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 min-h-[140px]">
          {loading ? (
            <p className="text-muted text-sm">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="text-muted text-sm">No comments yet — be the first.</p>
          ) : (
            comments.map((c) => (
              <CommentRow key={c.id} comment={c} currentUserId={currentUserId} onReply={setReplyTo} onDeleted={onDeleted} />
            ))
          )}
        </div>

        <div className="border-t border-white/10 p-3">
          {currentUserId ? (
            <>
              {replyTo && (
                <div className="flex items-center justify-between text-[11.5px] text-muted mb-1.5 px-1">
                  <span>Replying to @{replyTo.profiles?.handle}</span>
                  <button onClick={() => setReplyTo(null)}>
                    <Icon name="x" size={13} />
                  </button>
                </div>
              )}
              <form onSubmit={handlePost} className="flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={500}
                  placeholder={replyTo ? 'Write a reply…' : 'Add a comment…'}
                  className="input flex-1"
                />
                <EmojiPicker onPick={(e) => setText((t) => t + e)} />
                <button
                  type="submit"
                  disabled={posting || !text.trim()}
                  className="bg-amber text-ink rounded-xl w-9 h-9 flex items-center justify-center disabled:opacity-50 shrink-0"
                  aria-label="Post comment"
                >
                  <Icon name="send" size={17} />
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-teal font-semibold text-sm">
              Sign in to comment →
            </Link>
          )}
          {error && <p className="text-coral text-xs mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
