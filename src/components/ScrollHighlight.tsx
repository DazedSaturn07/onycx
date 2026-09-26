export default function ScrollHighlight({ text }: { text: string }) {
  return (
    <span className="scroll-highlight" data-scroll-highlight>
      {text.split(/(\s+)/).map((part, index) => /^\s+$/.test(part) ? part : <span className="scroll-highlight-word" key={index}>{part}</span>)}
    </span>
  );
}
