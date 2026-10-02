// Remembers the ordered list of video IDs a person was browsing (a profile's
// posts, a search result, an Explore category) in sessionStorage, so that
// opening one video and scrolling continues through that same list instead
// of dropping the person into an isolated single-video view.
const KEY = 'tubambe_video_list';

export function rememberVideoList(ids) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
}

export function getRememberedVideoList() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
