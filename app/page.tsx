import CourseList from "./_components/CourseList";
import Hero from "./_components/Hero";
import HomeChatPanel from "./_components/HomeChatPanel";

export default function Home() {
  return (
    <div>
      <Hero />
      <CourseList />
      <HomeChatPanel />
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-400/20 blur-[120px]" />
      <div className="absolute top-20 left-1/3 bottom-[-200px] h-[500px] w-[500px] rounded-full bg-pink-400/20 blur-[120px]" />
      <div className="absolute bottom-[-200px] left-1/3 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[120px]" />
      <div className="absolute top-[-200px] left-1/2 h-[500px] w-[500px] rounded-full bg-sky-400/20 blur-[120px]" />
    </div>
  );
}
