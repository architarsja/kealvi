type PollOptionProps = {
  option: {
    id: string;
    option_text: string;
  };
  onVote: (optionId: string) => void;
};

export default function PollOption({
  option,
  onVote,
}: PollOptionProps) {
  return (
    <button
      onClick={() => onVote(option.id)}
      className="border p-2 rounded w-full text-left hover:bg-gray-100"
    >
      {option.option_text}
    </button>
  );
}