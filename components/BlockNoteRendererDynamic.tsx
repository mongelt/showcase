import dynamic from 'next/dynamic'
import Loader from './Loader'

// Dynamic import with SSR disabled for BlockNote renderer
const BlockNoteRenderer = dynamic(
  () => import('./BlockNoteRenderer'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full flex items-center justify-center py-8">
        <Loader />
      </div>
    )
  }
)

export default BlockNoteRenderer
