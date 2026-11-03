import { useLocation } from '../router';
import Feed from '../components/Feed';

export default function Home() {
  const { params } = useLocation();
  let title = 'Latest questions';
  if (params.q) title = 'Search';
  else if (params.sort === 'likes') title = 'Top rated questions';

  return (
    <>
      <h1>{title}</h1>
      <Feed />
    </>
  );
}
