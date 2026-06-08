'use client';
import { useState, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────
type Question = {
  id: string;
  text: string;
  votes: number;
  voted: boolean;
  pinned: boolean;
  answered: boolean;
  createdAt: number;
};

type PollOption = { label: string; votes: number };
type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  voted: number | null;
  closed: boolean;
  createdAt: number;
};

type QFilter = 'latest' | 'top' | 'answered' | 'pinned';

// ── Component ──────────────────────────────────────────
export default function Home() {
  const [tab, setTab] = useState<'qa' | 'polls'>('qa');
  const [questions, setQuestions] = useState<Question[]>([
    { id:'1', text:"What's the roadmap for the mobile app?", votes:18, voted:false, pinned:true,  answered:false, createdAt: Date.now()-500000 },
    { id:'2', text:"How are you handling GDPR compliance?",  votes:14, voted:false, pinned:false, answered:true,  createdAt: Date.now()-400000 },
    { id:'3', text:"Will there be a public API for integrations?", votes:11, voted:false, pinned:false, answered:false, createdAt: Date.now()-300000 },
  ]);
  const [polls, setPolls] = useState<Poll[]>([
    {
      id:'1', question:"Which feature should we prioritize next?", voted:null, closed:false, createdAt: Date.now()-200000,
      options:[{label:"Dark mode",votes:22},{label:"Push notifications",votes:14},{label:"Offline support",votes:8},{label:"AI assistant",votes:31}]
    },
  ]);

  // Q&A state
  const [askText, setAskText] = useState('');
  const [search, setSearch] = useState('');
  const [qFilter, setQFilter] = useState<QFilter>('latest');

  // Poll creation state
  const [pollQ, setPollQ] = useState('');
  const [pollOpts, setPollOpts] = useState(['', '']);

  // ── Derived stats ──────────────────────────────────
  const totalVotes = questions.reduce((s,q)=>s+q.votes,0)
    + polls.reduce((s,p)=>s+p.options.reduce((a,o)=>a+o.votes,0),0);
  const livePolls = polls.filter(p=>!p.closed).length;

  // ── Q&A helpers ───────────────────────────────────
  function timeAgo(ts: number) {
    const m = Math.floor((Date.now()-ts)/60000);
    if(m < 1) return 'just now';
    if(m < 60) return `${m}m ago`;
    return `${Math.floor(m/60)}h ago`;
  }

  function filteredQs() {
    let qs = questions.filter(q => q.text.toLowerCase().includes(search.toLowerCase()));
    if(qFilter==='top')      qs = [...qs].sort((a,b)=>b.votes-a.votes);
    else if(qFilter==='latest')   qs = [...qs].sort((a,b)=>b.createdAt-a.createdAt);
    else if(qFilter==='answered') qs = qs.filter(q=>q.answered);
    else if(qFilter==='pinned')   qs = qs.filter(q=>q.pinned);
    return qs;
  }

  function submitQ() {
    const text = askText.trim();
    if(!text) return;
    const newQ: Question = {
      id: Date.now().toString(), text, votes:0,
      voted:false, pinned:false, answered:false, createdAt: Date.now()
    };
    setQuestions(prev => [newQ, ...prev]);
    setAskText('');
  }

  function vote(id: string) {
    setQuestions(prev => prev.map(q =>
      q.id===id ? { ...q, votes: q.voted ? q.votes-1 : q.votes+1, voted: !q.voted } : q
    ));
  }

  function togglePin(id: string) {
    setQuestions(prev => prev.map(q => q.id===id ? {...q, pinned:!q.pinned} : q));
  }

  // ── Poll helpers ──────────────────────────────────
  function addOpt() {
    if(pollOpts.length < 6) setPollOpts(prev => [...prev, '']);
  }
  function removeOpt(i: number) {
    if(pollOpts.length <= 2) return;
    setPollOpts(prev => prev.filter((_,idx)=>idx!==i));
  }
  function updateOpt(i: number, val: string) {
    setPollOpts(prev => prev.map((o,idx)=>idx===i?val:o));
  }

  function launchPoll() {
    if(!pollQ.trim()) return;
    const opts = pollOpts.filter(o=>o.trim());
    if(opts.length < 2) return;
    const newPoll: Poll = {
      id: Date.now().toString(), question: pollQ.trim(),
      options: opts.map(label=>({label, votes:0})),
      voted:null, closed:false, createdAt: Date.now()
    };
    setPolls(prev => [newPoll, ...prev]);
    setPollQ(''); setPollOpts(['','']);
  }

  function pollVote(pollId: string, optIdx: number) {
    setPolls(prev => prev.map(p => {
      if(p.id !== pollId || p.closed) return p;
      const options = p.options.map((o,i) => ({
        ...o,
        votes: i===optIdx ? o.votes+1 : (p.voted===i ? o.votes-1 : o.votes)
      }));
      return { ...p, options, voted: optIdx };
    }));
  }

  function closePoll(pollId: string) {
    setPolls(prev => prev.map(p => p.id===pollId ? {...p, closed:true} : p));
  }

  // ── Render ─────────────────────────────────────────
  const displayedQs = filteredQs();

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-dot" />
          <h1>Live<span>Q&A</span></h1>
        </div>
        <span className="live-badge">LIVE</span>
      </header>

      {/* Stats */}
      <div className="stats-bar">
        <div>
          <div className="stat-val">{questions.length}</div>
          <div className="stat-label">QUESTIONS</div>
        </div>
        <div>
          <div className="stat-val">{totalVotes}</div>
          <div className="stat-label">VOTES CAST</div>
        </div>
        <div>
          <div className="stat-val">{livePolls}</div>
          <div className="stat-label">LIVE POLLS</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab==='qa'?'active':''}`} onClick={()=>setTab('qa')}>
          <i className="ti ti-message-circle" aria-hidden /> Questions
          <span className="tab-badge">{questions.length}</span>
        </button>
        <button className={`tab ${tab==='polls'?'active':''}`} onClick={()=>setTab('polls')}>
          <i className="ti ti-chart-bar" aria-hidden /> Polls
          <span className="tab-badge">{polls.length}</span>
        </button>
      </div>

      {/* Q&A Panel */}
      {tab==='qa' && (
        <div className="panel">
          {/* Ask box */}
          <div className="ask-box">
            <div className="ask-label">ASK ANYTHING</div>
            <textarea
              placeholder="What's on your mind?"
              maxLength={300}
              value={askText}
              onChange={e=>setAskText(e.target.value)}
            />
            <div className="ask-row">
              <span className="char-count">{askText.length}/300</span>
              <button className="btn-primary" onClick={submitQ}>
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
              onChange={e=>setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="filters">
            {(['latest','top','answered','pinned'] as QFilter[]).map(f=>(
              <button key={f} className={`filter-btn ${qFilter===f?'active':''}`} onClick={()=>setQFilter(f)}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>

          {/* Question list */}
          {displayedQs.length===0 ? (
            <div className="empty-state">
              <i className="ti ti-search-off" aria-hidden />
              <p>No questions found.</p>
            </div>
          ) : displayedQs.map(q=>(
            <div key={q.id} className={`q-card ${q.pinned?'pinned':''}`}>
              <div className="vote-col">
                <button className={`vote-btn ${q.voted?'voted':''}`} onClick={()=>vote(q.id)} aria-label="Upvote">
                  <i className="ti ti-arrow-up" aria-hidden />
                </button>
                <span className="vote-count">{q.votes}</span>
              </div>
              <div className="q-body">
                <p className="q-text">{q.text}</p>
                <div className="q-meta">
                  <span className="q-time">{timeAgo(q.createdAt)}</span>
                  {q.answered && <span className="tag tag-answered">Answered</span>}
                  {q.pinned   && <span className="tag tag-pinned">Pinned</span>}
                  <button className={`pin-btn ${q.pinned?'pinned':''}`} onClick={()=>togglePin(q.id)} aria-label="Pin">
                    <i className={`ti ti-pin${q.pinned?'':''}`} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Polls Panel */}
      {tab==='polls' && (
        <div className="panel">
          {/* Create poll */}
          <div className="poll-create">
            <div className="section-label">CREATE A POLL</div>
            <input className="field" placeholder="Poll question..." maxLength={200} value={pollQ} onChange={e=>setPollQ(e.target.value)} />
            {pollOpts.map((opt,i)=>(
              <div className="option-row" key={i}>
                <input className="field" placeholder={`Option ${i+1}`} maxLength={80} value={opt} onChange={e=>updateOpt(i,e.target.value)} />
                <button className="rm-btn" onClick={()=>removeOpt(i)} aria-label="Remove option">
                  <i className="ti ti-x" aria-hidden />
                </button>
              </div>
            ))}
            <button className="add-opt-btn" onClick={addOpt}>
              <i className="ti ti-plus" aria-hidden /> Add option
            </button>
            <button className="btn-launch" onClick={launchPoll}>
              <i className="ti ti-player-play" aria-hidden /> Launch Poll
            </button>
          </div>

          {/* Poll list */}
          {polls.length===0 ? (
            <div className="empty-state">
              <i className="ti ti-chart-bar" aria-hidden />
              <p>No polls yet. Create one above!</p>
            </div>
          ) : polls.map(poll=>{
            const total = poll.options.reduce((s,o)=>s+o.votes,0);
            const maxV  = Math.max(...poll.options.map(o=>o.votes));
            const hasVoted = poll.voted!==null || poll.closed;
            return (
              <div key={poll.id} className={`poll-card ${poll.closed?'closed':''}`}>
                <div className="poll-header">
                  <p className="poll-title">{poll.question}</p>
                  <span className={`poll-status ${poll.closed?'closed':'live'}`}>
                    {poll.closed?'CLOSED':'LIVE'}
                  </span>
                </div>

                {poll.options.map((opt,i)=>{
                  const pct     = total ? Math.round(opt.votes/total*100) : 0;
                  const isWin   = hasVoted && opt.votes===maxV && maxV>0;
                  const isSel   = poll.voted===i;
                  return (
                    <div
                      key={i}
                      className={`poll-option ${isSel?'selected':''} ${isWin?'winner':''} ${hasVoted?'voted-locked':''}`}
                      onClick={()=>!hasVoted && pollVote(poll.id, i)}
                    >
                      <div className="option-fill" style={{width: hasVoted?`${pct}%`:'0%'}} />
                      <div className="option-inner">
                        <span className="option-label">{opt.label}{isWin?' 🏆':''}</span>
                        {hasVoted && <span className="option-pct">{pct}%</span>}
                      </div>
                    </div>
                  );
                })}

                <div className="poll-footer">
                  <span className="total-votes">
                    <i className="ti ti-users" aria-hidden style={{fontSize:13,verticalAlign:-1,marginRight:4}} />
                    {total} vote{total!==1?'s':''}
                  </span>
                  {!poll.closed && (
                    <button className="btn-ghost" style={{marginLeft:'auto'}} onClick={()=>closePoll(poll.id)}>
                      Close poll
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}