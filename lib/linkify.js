// Turns plain URLs in bio text into clickable links, without a Markdown
// parser — bios are short, this is all they need.
export function linkifyParts(text) {
  if (!text) return [];
  const re = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(re);
  return parts.map((part, i) =>
    re.test(part) ? { type: 'link', text: part, key: i } : { type: 'text', text: part, key: i }
  );
}
