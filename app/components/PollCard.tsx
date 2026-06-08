'use client';
import { Poll, submitPollVote, closePollById } from '@/lib/polls';
import { getFingerprint } from '@/lib/voter';
import PollOption from './PollOption';

type Props = {
  poll: Poll;
  onUpdate: () => void;
};

export default function PollCard({ poll, onUpdate }: Props) {
  const total = (poll.options ?? []).reduce((s, o) => s + o.votes_count, 0);
  const maxV  = Math.max(...(poll.options ?? []).map((o) => o.votes_count), 0);
  const hasVoted = poll.user_voted_option != null || poll.is_closed;
  
  async function handleVote(optionId: string) {
    if (hasVoted || poll.is_closed) return;
    const fp = getFingerprint();
    await submitPollVote(poll.id, optionId, poll.user_voted_option ?? null, fp);
    onUpdate();
  }

  async function handleClose() {
    await closePollById(poll.id);
    onUpdate();
  }

  return (
    <div className={`poll-card ${poll.is_closed ? 'closed' : ''}`}>
      {/* Header */}
      <div className="poll-header">
        <p className="poll-title">{poll.title}</p>
        <span className={`poll-status ${poll.is_closed ? 'closed' : 'live'}`}>
          {poll.is_closed ? 'CLOSED' : 'LIVE'}
        </span>
      </div>

      {/* Options */}
      {(poll.options ?? []).map((opt) => {
        const pct    = total ? Math.round((opt.votes_count / total) * 100) : 0;
        const isWin  = hasVoted && opt.votes_count === maxV && maxV > 0;
        const isSel  = poll.user_voted_option === opt.id;
        return (
          <PollOption
            key={opt.id}
            label={opt.label}
            pct={pct}
            isSelected={isSel}
            isWinner={isWin}
            showResult={hasVoted}
            onClick={() => handleVote(opt.id)}
          />
        );
      })}

      {/* Footer */}
      <div className="poll-footer">
        <span className="total-votes">
          <i className="ti ti-users" aria-hidden
             style={{ fontSize: 13, verticalAlign: -1, marginRight: 4 }} />
          {total} vote{total !== 1 ? 's' : ''}
        </span>
        {!poll.is_closed && (
          <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={handleClose}>
            Close poll
          </button>
        )}
      </div>
    </div>
  );
}