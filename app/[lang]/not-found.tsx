import { NotFoundMessage } from '@/components/not-found-message';

// notFound() inside a page (unknown album or collection) lands here, within the [lang] layout.
export default function NotFound() {
  return <NotFoundMessage />;
}
