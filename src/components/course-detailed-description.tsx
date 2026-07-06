function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

type Props = {
  text: string;
};

export function CourseDetailedDescription({ text }: Props) {
  const paragraphs = splitParagraphs(text);

  return (
    <div className="course-detail-prose">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}
