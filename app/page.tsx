import LanguageSwitcher from "./components/LanguageSwitcher";
import SortFilter from "./components/SortFilter";
import QuestionsList from "./questions-list";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto p-5">
      <div className="flex justify-between mb-4">
        <LanguageSwitcher />
        <SortFilter />
      </div>

      <QuestionsList />
    </main>
  );
}