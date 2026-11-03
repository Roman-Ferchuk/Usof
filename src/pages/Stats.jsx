import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from '../router';
import { fetchStats } from '../store/statsSlice';
import { fileUrl } from '../api/client';
import { plural } from '../utils';
import Avatar from '../components/Avatar';
import { BarList, LineChart, Ring } from '../components/charts';

const NUMBER = new Intl.NumberFormat();

function Tile({ label, value }) {
  return (
    <div className="tile">
      <b>{NUMBER.format(value)}</b>
      <span>{label}</span>
    </div>
  );
}

export default function Stats() {
  const dispatch = useDispatch();
  const { data, status, error } = useSelector((s) => s.stats);

  useEffect(() => { dispatch(fetchStats()); }, [dispatch]);

  if (status === 'failed') return <p className="field__error" role="alert">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;

  const { totals, activity } = data;
  const labels = activity.map((a) => a.day);
  const quiet = activity.every((a) => !a.posts && !a.comments && !a.views);

  return (
    <>
      <h1>Statistics</h1>
      <p className="muted">How the community is doing. Only public, active content is counted.</p>

      <div className="tiles">
        <Tile label="Members" value={totals.users} />
        <Tile label="Questions" value={totals.posts} />
        <Tile label="Comments" value={totals.comments} />
        <Tile label="Views" value={totals.views} />
        <Tile label="Categories" value={totals.categories} />
      </div>

      <section className="panel" aria-labelledby="activity-title">
        <h2 id="activity-title">Last 30 days</h2>
        {quiet && <p className="muted">Nothing happened in the last 30 days. Ask a question to get it going.</p>}
        <LineChart
          title="Questions, comments and views per day over the last 30 days"
          labels={labels}
          series={[
            { key: 'posts', name: 'Questions', values: activity.map((a) => a.posts) },
            { key: 'comments', name: 'Comments', values: activity.map((a) => a.comments) },
            { key: 'views', name: 'Views', values: activity.map((a) => a.views) },
          ]}
        />
      </section>

      <div className="grid-2">
        <section className="panel" aria-labelledby="cat-title">
          <h2 id="cat-title">Popular categories</h2>
          {data.categories.length === 0 && <p className="muted">No categories yet.</p>}
          <BarList
            items={data.categories.map((c) => ({ key: c.id, label: c.title, value: c.posts, id: c.id }))}
            render={(i) => <Link to={`/?category=${i.id}`}>{i.label}</Link>}
          />
        </section>

        <section className="panel" aria-labelledby="mood-title">
          <h2 id="mood-title">Mood of the votes</h2>
          <Ring good={totals.likes} bad={totals.dislikes} />
        </section>

        <section className="panel" aria-labelledby="authors-title">
          <h2 id="authors-title">Top members</h2>
          <ol className="board">
            {data.topAuthors.map((a, i) => (
              <li key={a.id}>
                <span className="board__rank">{i + 1}</span>
                <Link to={`/profile/${a.id}`} className="byline">
                  <Avatar user={{ login: a.login, avatar: fileUrl(a.profilePicture) }} size={24} />
                  {a.login}
                </Link>
                <small className="muted">{plural(a.posts, 'question')}</small>
                <b>{a.rating}</b>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel" aria-labelledby="viewed-title">
          <h2 id="viewed-title">Most viewed questions</h2>
          <ol className="board">
            {data.topPosts.map((p, i) => (
              <li key={p.id}>
                <span className="board__rank">{i + 1}</span>
                <Link to={`/posts/${p.id}`} className="board__title">{p.title}</Link>
                <b title="Views">{NUMBER.format(p.views)}</b>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
