'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchQuestions, addQuestion, togglePinQuestion, type Question } from '@/lib/questions';
import { fetchPolls, createPoll, type Poll } from '@/lib/polls';
import { getFingerprint } from '@/lib/voter';
import PollCard from './components/PollCard';

type QFilter = 'latest' | 'top' | 'answered' | 'pinned';
const SESSION = 'main-session'; // change per event/room

export default function Home() {
  const [tab, setTab]             = useState<'qa' | 'polls'>('qa');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [polls, setPolls]         = useState<Poll[]>([]);
  const [loading, setLoading]     = useState(true);

  // Q&A
  const [askText, setAskText] = useState('');
  const [search, setSearch]   = useState('');
  const [qFilter, setQFilter] = useState<QFilter>('latest');

  // Poll creation
  const [pollQ, setPollQ]       = useState('');
  const [pollOpts, setPollOpts] = useState(['', '']);

  // ── Load ─────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    const fp = getFingerprint();
    const [qs, ps] = await Promise.all([
      fetchQuestions(fp),
      fetchPolls(fp),
    ]);
    setQuestions(qs);
    setPolls(ps);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();

    // Realtime subscriptions
    // Import supabase here to avoid SSR issues
    import('@/lib/supabase').then(({ supabase }) => {
      const ch = supabase
        .channel('realtime-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' },   loadAll)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' },       loadAll)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' },       loadAll)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_options' },loadAll)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' },  loadAll)
        .subscribe();

      return () => { supabase.removeChannel(ch); };
    });
  }, [loadAll]);

  // ── Q&A helpers ──────────────────────────────────────
  function timeAgo(ts: string) {
    const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  function filteredQs() {
    let qs = questions.filter((q) =>
      (q.body ?? '').toLowerCase().includes(search.toLowerCase())
    );
    if (qFilter === 'top')      qs = [...qs].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
    if (qFilter === 'latest')   qs = [...qs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (qFilter === 'answered') qs = qs.filter((q) => q.is_answered);
    if (qFilter === 'pinned')   qs = qs.filter((q) => q.is_pinned);
    return qs;
  }

  async function handleAsk() {
    const text = askText.trim();
    if (!text) return;
    setAskText('');
    await addQuestion(text, SESSION);
    loadAll();
  }

  async function handleVote(id: string, voted: boolean) {
    // Optimistic
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, vote_count: voted ? (q.vote_count ?? 1) - 1 : (q.vote_count ?? 0) + 1, user_voted: !voted }
          : q
      )
    );
    const fp = getFingerprint();
    await fetch(`/api/questions/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_fingerprint: fp }),
    });
  }

  async function handlePin(id: string, current: boolean) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, is_pinned: !current } : q))
    );
    await togglePinQuestion(id, current);
  }

  // ── Poll helpers ─────────────────────────────────────
  function addOpt() { if (pollOpts.length < 6) setPollOpts((p) => [...p, '']); }
  function removeOpt(i: number) { if (pollOpts.length > 2) setPollOpts((p) => p.filter((_, idx) => idx !== i)); }
  function updateOpt(i: number, v: string) { setPollOpts((p) => p.map((o, idx) => (idx === i ? v : o))); }

  async function handleLaunchPoll() {
    if (!pollQ.trim()) return;
    const opts = pollOpts.filter((o) => o.trim());
    if (opts.length < 2) return;
    await createPoll(pollQ.trim(), opts);
    setPollQ(''); setPollOpts(['', '']);
    loadAll();
  }

  // ── Stats ─────────────────────────────────────────────
  const totalVotes = questions.reduce((s, q) => s + (q.vote_count ?? 0), 0)
    + polls.reduce((s, p) => s + (p.options ?? []).reduce((a, o) => a + o.votes_count, 0), 0);
  const livePolls  = polls.filter((p) => !p.is_closed).length;
  const displayedQs = filteredQs();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100vh', color: 'var(--muted)', fontFamily: 'Syne,sans-serif', fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      {/* ── Header ── */}
      <header className="header">
        <div className="logo">
          <div className="logo-dot" />
          <h1>Live<span>Q&A</span></h1>
        </div>
        <span className="live-badge">LIVE</span>
      </header>

      {/* ── Stats ── */}
      <div className="stats-bar">
        <div><div className="stat-val">{questions.length}</div><div className="stat-label">QUESTIONS</div></div>
        <div><div className="stat-val">{totalVotes}</div><div className="stat-label">VOTES CAST</div></div>
        <div><div className="stat-val">{livePolls}</div><div className="stat-label">LIVE POLLS</div></div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tab ${tab === 'qa' ? 'active' : ''}`} onClick={() => setTab('qa')}>
          <i className="ti ti-message-circle" aria-hidden /> Questions
          <span className="tab-badge">{questions.length}</span>
        </button>
        <button className={`tab ${tab === 'polls' ? 'active' : ''}`} onClick={() => setTab('polls')}>
          <i className="ti ti-chart-bar" aria-hidden /> Polls
          <span className="tab-badge">{polls.length}</span>
        </button>
      </div>

      {/* ── Q&A Panel ── */}
      {tab === 'qa' && (
        <div className="panel">
          {/* Ask */}
          <div className="ask-box">
            <div className="ask-label">ASK ANYTHING</div>
            <textarea
              placeholder="What's on your mind?"
              maxLength={300}
              value={askText}
              onChange={(e) => setAskText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleAsk(); }}
            />
            <div className="ask-row">
              <span className="char-count">{askText.length}/300</span>
              <button className="btn-primary" onClick={handleAsk}>
                <i className="ti ti-send" aria-hidden /> Ask
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="search-wrap">
            <i className="ti ti-search search-icon" aria-hidden />
            <input
              className="search-input"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="filters">
            {(['latest', 'top', 'answered', 'pinned'] as QFilter[]).map((f) => (
              <button
                key={f}
                className={`filter-btn ${qFilter === f ? 'active' : ''}`}
                onClick={() => setQFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Questions */}
          {displayedQs.length === 0 ? (
            <div className="empty-state">
              <i className="ti ti-search-off" aria-hidden />
              <p>No questions found.</p>
            </div>
          ) : (
            displayedQs.map((q) => (
              <div key={q.id} className={`q-card ${q.is_pinned ? 'pinned' : ''}`}>
                <div className="vote-col">
                  <button
                    className={`vote-btn ${q.user_voted ? 'voted' : ''}`}
                    onClick={() => handleVote(q.id, !!q.user_voted)}
                    aria-label="Upvote"
                  >
                    <i className="ti ti-arrow-up" aria-hidden />
                  </button>
                  <span className="vote-count">{q.vote_count ?? 0}</span>
                </div>
                <div className="q-body">
                  <p className="q-text">{q.body}</p>
                  <div className="q-meta">
                    <span className="q-time">{timeAgo(q.created_at)}</span>
                    {q.is_answered && <span className="tag tag-answered">Answered</span>}
                    {q.is_pinned   && <span className="tag tag-pinned">Pinned</span>}
                    <button
                      className={`pin-btn ${q.is_pinned ? 'pinned' : ''}`}
                      onClick={() => handlePin(q.id, !!q.is_pinned)}
                      aria-label="Pin"
                    >
                      <i className="ti ti-pin" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Polls Panel ── */}
      {tab === 'polls' && (
        <div className="panel">
          {/* Create poll */}
          <div className="poll-create">
            <div className="section-label">CREATE A POLL</div>
            <input
              className="field"
              placeholder="Poll question..."
              maxLength={200}
              value={pollQ}
              onChange={(e) => setPollQ(e.target.value)}
            />
            {pollOpts.map((opt, i) => (
              <div className="option-row" key={i}>
                <input
                  className="field"
                  placeholder={`Option ${i + 1}`}
                  maxLength={80}
                  value={opt}
                  onChange={(e) => updateOpt(i, e.target.value)}
                />
                <button className="rm-btn" onClick={() => removeOpt(i)} aria-label="Remove">
                  <i className="ti ti-x" aria-hidden />
                </button>
              </div>
            ))}
            <button className="add-opt-btn" onClick={addOpt}>
              <i className="ti ti-plus" aria-hidden /> Add option
            </button>
            <button className="btn-launch" onClick={handleLaunchPoll}>
              <i className="ti ti-player-play" aria-hidden /> Launch Poll
            </button>
          </div>

          {/* Poll list */}
          {polls.length === 0 ? (
            <div className="empty-state">
              <i className="ti ti-chart-bar" aria-hidden />
              <p>No polls yet. Create one above!</p>
            </div>
          ) : (
            polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} onUpdate={loadAll} />
            ))
          )}
        </div>
      )}
    </>
  );
}