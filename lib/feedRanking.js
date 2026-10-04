// A lightweight "for you" feel without a real ML recommendation system:
// newer and more-engaged videos are more likely to rank high, but a random
// factor means the order genuinely changes on every refresh — unlike a
// plain "newest first" sort, which shows every visitor the exact same list
// in the exact same order forever.
export function rankFeed(videos) {
  const n = videos.length;
  return videos
    .map((v, i) => {
      const recencyRank = n - i; // videos arrive newest-first; earlier index = more recent
      const engagement =
        (v.likes?.[0]?.count || 0) * 2 +
        (v.comments?.[0]?.count || 0) * 3 +
        (v.reposts?.[0]?.count || 0) * 4 +
        (v.views_count || 0) * 0.1;
      const score = recencyRank * 1.5 + engagement + Math.random() * n * 4;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.v);
}
